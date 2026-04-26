type SpriteFrame = {
  holdMs: number;
  src: string;
};

type SpriteGameConfig = {
  bodyWidthRatio: number;
  footHeightRatio: number;
  gravityPxPerSecondSquared: number;
  horizontalForgivenessPx: number;
  jumpVelocityPxPerSecond: number;
  maxFallPxPerSecond: number;
  moveAccelerationPxPerSecondSquared: number;
  moveFrictionPxPerSecondSquared: number;
  moveSpeedPxPerSecond: number;
  platformVerticalForgivenessPx: number;
  spawnViewportXRatio: number;
};

type SpritePayload = {
  frames: SpriteFrame[];
  game: SpriteGameConfig;
  walkFrames: SpriteFrame[];
};

type TextPlatform = {
  bottom: number;
  effectRoot: HTMLElement;
  element: HTMLElement;
  lineElement: HTMLElement;
  left: number;
  right: number;
  top: number;
};

type ControlKey = "left" | "right";
type ControlAction = ControlKey | "jump" | "down" | "escape";
type SpriteFrameSetName = "default" | "walk";

type SpriteGameState = {
  active: boolean;
  animationFrameId: number | null;
  activeImage: HTMLImageElement;
  currentFrameIndex: number;
  currentFrameSet: SpriteFrameSetName;
  frameImages: Map<string, HTMLImageElement>;
  currentPlatform: TextPlatform | null;
  currentPlatformTop: number | null;
  dropThroughPlatformTop: number | null;
  dropThroughUntil: number;
  facing: "left" | "right";
  frames: SpriteFrame[];
  game: SpriteGameConfig;
  grounded: boolean;
  hasSpawned: boolean;
  jumpQueuedUntil: number;
  keys: Set<ControlKey>;
  lastFrameAt: number;
  lastGroundedAt: number;
  lastTime: number;
  platforms: TextPlatform[];
  platformsDirty: boolean;
  pressuredElements: Set<HTMLElement>;
  rippleElements: Set<HTMLElement>;
  rippleTimers: number[];
  rippleToken: number;
  vx: number;
  vy: number;
  walkFrames: SpriteFrame[];
  x: number;
  y: number;
};

const TEXT_PLATFORM_SELECTOR = [
  "[data-blog-scene-root] .blog-scene-line-fragment",
  "[data-blog-scene-root] .blog-year-group__title",
  "[data-blog-scene-root] .archive-panel__count",
  "[data-blog-scene-root] .post-meta time",
  "[data-blog-scene-root] .post-meta span",
  "[data-blog-scene-root] .post-tags li",
  ".page-heading__title",
  ".page-heading__copy",
].join(",");

const DEFAULT_GAME_CONFIG: SpriteGameConfig = {
  bodyWidthRatio: 0.4,
  footHeightRatio: 0.84,
  gravityPxPerSecondSquared: 2200,
  horizontalForgivenessPx: 8,
  jumpVelocityPxPerSecond: 720,
  maxFallPxPerSecond: 1500,
  moveAccelerationPxPerSecondSquared: 2600,
  moveFrictionPxPerSecondSquared: 3000,
  moveSpeedPxPerSecond: 340,
  platformVerticalForgivenessPx: 8,
  spawnViewportXRatio: 0.66,
};

const JUMP_BUFFER_MS = 140;
const COYOTE_TIME_MS = 110;
const DROP_THROUGH_MS = 520;
const DROP_THROUGH_NUDGE_PX = 14;
const BOTTOM_FLOOR_GAP_PX = 38;
const LANDING_RIPPLE_MIN_VELOCITY = 0;
const TEXT_RIPPLE_DURATION_MS = 760;
const VIEWPORT_PADDING_PX = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return clamp(value, min, max);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseSpritePayload(value: string): SpritePayload | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const frames = parseFrameList(parsed.frames);

  if (frames.length === 0) {
    return null;
  }

  const walkFrames = parseFrameList(parsed.walkFrames);

  return {
    frames,
    game: normalizeGameConfig(parsed.game),
    walkFrames: walkFrames.length > 0 ? walkFrames : frames,
  };
}

function parseFrameList(value: unknown): SpriteFrame[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((frame): SpriteFrame | null => {
      if (!isRecord(frame) || typeof frame.src !== "string" || frame.src.length === 0) {
        return null;
      }

      return {
        holdMs: readNumber(frame.holdMs, 160, 0),
        src: frame.src,
      };
    })
    .filter((frame): frame is SpriteFrame => frame !== null);
}

function normalizeGameConfig(value: unknown): SpriteGameConfig {
  const source = isRecord(value) ? value : {};

  return {
    bodyWidthRatio: readNumber(
      source.bodyWidthRatio,
      DEFAULT_GAME_CONFIG.bodyWidthRatio,
      0.18,
      0.9,
    ),
    footHeightRatio: readNumber(
      source.footHeightRatio,
      DEFAULT_GAME_CONFIG.footHeightRatio,
      0.55,
      1,
    ),
    gravityPxPerSecondSquared: readNumber(
      source.gravityPxPerSecondSquared,
      DEFAULT_GAME_CONFIG.gravityPxPerSecondSquared,
      500,
      5000,
    ),
    horizontalForgivenessPx: readNumber(
      source.horizontalForgivenessPx,
      DEFAULT_GAME_CONFIG.horizontalForgivenessPx,
      0,
      40,
    ),
    jumpVelocityPxPerSecond: readNumber(
      source.jumpVelocityPxPerSecond,
      DEFAULT_GAME_CONFIG.jumpVelocityPxPerSecond,
      250,
      1800,
    ),
    maxFallPxPerSecond: readNumber(
      source.maxFallPxPerSecond,
      DEFAULT_GAME_CONFIG.maxFallPxPerSecond,
      400,
      2600,
    ),
    moveAccelerationPxPerSecondSquared: readNumber(
      source.moveAccelerationPxPerSecondSquared,
      DEFAULT_GAME_CONFIG.moveAccelerationPxPerSecondSquared,
      400,
      7000,
    ),
    moveFrictionPxPerSecondSquared: readNumber(
      source.moveFrictionPxPerSecondSquared,
      DEFAULT_GAME_CONFIG.moveFrictionPxPerSecondSquared,
      400,
      8000,
    ),
    moveSpeedPxPerSecond: readNumber(
      source.moveSpeedPxPerSecond,
      DEFAULT_GAME_CONFIG.moveSpeedPxPerSecond,
      80,
      900,
    ),
    platformVerticalForgivenessPx: readNumber(
      source.platformVerticalForgivenessPx,
      DEFAULT_GAME_CONFIG.platformVerticalForgivenessPx,
      0,
      32,
    ),
    spawnViewportXRatio: readNumber(
      source.spawnViewportXRatio,
      DEFAULT_GAME_CONFIG.spawnViewportXRatio,
      0.08,
      0.92,
    ),
  };
}

function getTextRects(element: Element): DOMRect[] {
  const range = document.createRange();
  range.selectNodeContents(element);
  return Array.from(range.getClientRects());
}

function getPlatformRects(element: HTMLElement): DOMRect[] {
  if (element.classList.contains("blog-scene-line-fragment")) {
    return [element.getBoundingClientRect()];
  }

  return getTextRects(element);
}

function closestHTMLElement(element: Element, selector: string): HTMLElement | null {
  const match = element.closest(selector);
  return match instanceof HTMLElement ? match : null;
}

function getTextEffectRoot(element: HTMLElement): HTMLElement {
  return (
    closestHTMLElement(element, "[data-blog-scene-enhanced]") ??
    closestHTMLElement(element, ".post-meta") ??
    closestHTMLElement(element, ".post-tags") ??
    closestHTMLElement(element, ".archive-panel__heading") ??
    closestHTMLElement(element, ".page-heading") ??
    closestHTMLElement(element, ".blog-year-group") ??
    element
  );
}

function splitTextIntoGraphemes(text: string): string[] {
  if ("Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(document.documentElement.lang || undefined, {
      granularity: "grapheme",
    });
    return Array.from(segmenter.segment(text), (segment) => segment.segment);
  }

  return Array.from(text);
}

function ensureBlogSceneLetters(root: HTMLElement): HTMLElement[] {
  const fragments = (
    root.classList.contains("blog-scene-line-fragment")
      ? [root]
      : Array.from(root.querySelectorAll(".blog-scene-line-fragment"))
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);

  for (const fragment of fragments) {
    if (fragment.dataset.blogSceneLettersReady === "true") {
      continue;
    }

    const text = fragment.dataset.blogSceneFragmentText ?? fragment.textContent ?? "";
    const textFragment = document.createDocumentFragment();

    for (const [index, grapheme] of splitTextIntoGraphemes(text).entries()) {
      const letterElement = document.createElement("span");
      letterElement.className = "blog-scene-letter";
      letterElement.dataset.blogSceneLetterIndex = String(index);
      letterElement.textContent = grapheme;
      textFragment.append(letterElement);
    }

    fragment.replaceChildren(textFragment);
    fragment.dataset.blogSceneLettersReady = "true";
  }

  return Array.from(root.querySelectorAll(".blog-scene-letter")).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
}

function collectTextPlatforms(game: SpriteGameConfig): TextPlatform[] {
  const platforms: TextPlatform[] = [];
  const elements = Array.from(document.querySelectorAll(TEXT_PLATFORM_SELECTOR));
  const lowerBound = window.innerHeight + 260;

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    const style = window.getComputedStyle(element);

    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      continue;
    }

    for (const rect of getPlatformRects(element)) {
      if (rect.width < 10 || rect.height < 5 || rect.bottom < -160 || rect.top > lowerBound) {
        continue;
      }

      platforms.push({
        bottom: rect.bottom,
        effectRoot: getTextEffectRoot(element),
        element,
        lineElement: closestHTMLElement(element, ".blog-scene-line") ?? element,
        left: rect.left - game.horizontalForgivenessPx,
        right: rect.right + game.horizontalForgivenessPx,
        top: rect.top,
      });
    }
  }

  return platforms.sort((first, second) => first.top - second.top || first.left - second.left);
}

function hasDisconnectedPlatforms(platforms: TextPlatform[]): boolean {
  return platforms.some(
    (platform) => !platform.element.isConnected || !platform.effectRoot.isConnected,
  );
}

function getControlKey(eventKey: string): ControlAction | null {
  switch (eventKey) {
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    case " ":
    case "ArrowUp":
    case "w":
    case "W":
      return "jump";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "Escape":
      return "escape";
    default:
      return null;
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

function getRunnerSize(runner: HTMLElement): { height: number; width: number } {
  const rect = runner.getBoundingClientRect();
  return {
    height: Math.max(rect.height, 48),
    width: Math.max(rect.width, 48),
  };
}

function getFootSpan(
  state: SpriteGameState,
  nextX: number,
  width: number,
): { left: number; right: number } {
  const bodyWidth = width * state.game.bodyWidthRatio;
  const center = nextX + width / 2;

  return {
    left: center - bodyWidth / 2,
    right: center + bodyWidth / 2,
  };
}

function renderRunner(runner: HTMLElement, state: SpriteGameState): void {
  runner.style.setProperty("--sprite-game-x", `${state.x.toFixed(2)}px`);
  runner.style.setProperty("--sprite-game-y", `${state.y.toFixed(2)}px`);
  runner.dataset.facing = state.facing;
  runner.dataset.gameGrounded = String(state.grounded);
  runner.dataset.gamePlatformCount = String(state.platforms.length);
  runner.dataset.gameTextPlatform =
    state.currentPlatform?.element.textContent?.trim().slice(0, 80) ?? "";
}

function getFrameKey(frameSetName: SpriteFrameSetName, frameIndex: number): string {
  return `${frameSetName}:${frameIndex}`;
}

function getTextEffectTargets(platform: TextPlatform): HTMLElement[] {
  const root = platform.effectRoot;
  let letters = Array.from(root.querySelectorAll(".blog-scene-letter")).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );

  if (letters.length === 0) {
    letters = ensureBlogSceneLetters(root);
  }

  if (letters.length > 0) {
    return letters;
  }

  const groupedTargets = Array.from(root.querySelectorAll("time, span, li, a, h1, h2, p")).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );

  return groupedTargets.length > 0 ? groupedTargets : [platform.element];
}

function getTextPressureTargets(platform: TextPlatform): HTMLElement[] {
  let lineLetters = Array.from(
    platform.lineElement.querySelectorAll(".blog-scene-letter"),
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);

  if (lineLetters.length === 0) {
    lineLetters = ensureBlogSceneLetters(platform.lineElement);
  }

  if (lineLetters.length > 0) {
    return lineLetters;
  }

  return [platform.element];
}

function resetTextPressureElement(element: HTMLElement): void {
  delete element.dataset.spriteTextPressure;
  element.style.removeProperty("--sprite-text-pressure-y");
  element.style.removeProperty("--sprite-text-pressure-rotate");
  element.style.removeProperty("--sprite-text-pressure-strength");
}

function clearTextPressure(state: SpriteGameState): void {
  for (const element of state.pressuredElements) {
    resetTextPressureElement(element);
  }

  state.pressuredElements.clear();
}

function applyTextPressure(runner: HTMLElement, state: SpriteGameState): void {
  const platform = state.currentPlatform;

  if (!state.active || !state.grounded || !platform?.element.isConnected) {
    clearTextPressure(state);
    return;
  }

  const { width } = getRunnerSize(runner);
  const footCenterX = state.x + width / 2;
  const targets = getTextPressureTargets(platform);
  const horizontalRadius = Math.max(34, width * 0.34);
  const nextPressure = new Map<HTMLElement, { rotate: string; strength: string; y: string }>();

  for (const target of targets) {
    const rect = target.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }

    const centerX = rect.left + rect.width / 2;
    const horizontalDistance = Math.abs(footCenterX - centerX);
    const horizontalStrength = Math.cos(
      clamp(horizontalDistance / horizontalRadius, 0, 1) * (Math.PI / 2),
    );
    const strength = horizontalStrength * horizontalStrength;

    if (strength < 0.025) {
      continue;
    }

    const direction = clamp((centerX - footCenterX) / horizontalRadius, -1, 1);
    nextPressure.set(target, {
      rotate: `${(direction * strength * 5.5).toFixed(2)}deg`,
      strength: strength.toFixed(3),
      y: `${(0.8 + strength * 8.4).toFixed(2)}px`,
    });
  }

  for (const element of Array.from(state.pressuredElements)) {
    if (!nextPressure.has(element) || !element.isConnected) {
      resetTextPressureElement(element);
      state.pressuredElements.delete(element);
    }
  }

  for (const [target, pressure] of nextPressure) {
    target.dataset.spriteTextPressure = "true";
    target.style.setProperty("--sprite-text-pressure-y", pressure.y);
    target.style.setProperty("--sprite-text-pressure-rotate", pressure.rotate);
    target.style.setProperty("--sprite-text-pressure-strength", pressure.strength);
    state.pressuredElements.add(target);
  }
}

function clearRippleTimers(state: SpriteGameState): void {
  while (state.rippleTimers.length > 0) {
    const timerId = state.rippleTimers.pop();

    if (typeof timerId === "number") {
      window.clearTimeout(timerId);
    }
  }

  for (const element of state.rippleElements) {
    delete element.dataset.spriteTextRipple;
    element.style.removeProperty("--sprite-ripple-delay");
    element.style.removeProperty("--sprite-ripple-y");
    element.style.removeProperty("--sprite-ripple-rotate");
  }

  state.rippleElements.clear();
}

function triggerTextRipple(
  state: SpriteGameState,
  platform: TextPlatform,
  impactX: number,
  landingVelocity: number,
): void {
  if (!platform.element.isConnected) {
    return;
  }

  const targets = getTextEffectTargets(platform);

  if (targets.length === 0) {
    return;
  }

  const token = state.rippleToken + 1;
  const power = clamp(landingVelocity / state.game.maxFallPxPerSecond, 0.18, 0.72);
  let maxDelay = 0;

  state.rippleToken = token;
  clearRippleTimers(state);

  for (const target of targets) {
    const rect = target.getBoundingClientRect();
    const targetCenterX = rect.left + rect.width / 2;
    const targetCenterY = rect.top + rect.height / 2;
    const distance = Math.hypot(targetCenterX - impactX, targetCenterY - platform.top);
    const delay = Math.min(420, distance * 0.52);
    const rippleY = 2.4 + power * 7.8;
    const rippleRotate = clamp((targetCenterX - impactX) / 160, -1, 1) * (1.6 + power * 4.2);

    maxDelay = Math.max(maxDelay, delay);
    delete target.dataset.spriteTextRipple;
    target.style.setProperty("--sprite-ripple-delay", `${delay.toFixed(0)}ms`);
    target.style.setProperty("--sprite-ripple-y", `${rippleY.toFixed(2)}px`);
    target.style.setProperty("--sprite-ripple-rotate", `${rippleRotate.toFixed(2)}deg`);

    // Restart the CSS animation even when landing repeatedly on the same sentence.
    void target.offsetWidth;
    target.dataset.spriteTextRipple = "true";
    state.rippleElements.add(target);
  }

  const timerId = window.setTimeout(() => {
    if (state.rippleToken !== token) {
      return;
    }

    for (const target of targets) {
      delete target.dataset.spriteTextRipple;
      target.style.removeProperty("--sprite-ripple-delay");
      target.style.removeProperty("--sprite-ripple-y");
      target.style.removeProperty("--sprite-ripple-rotate");
      state.rippleElements.delete(target);
    }
  }, TEXT_RIPPLE_DURATION_MS + maxDelay);

  state.rippleTimers.push(timerId);
}

function showFrame(
  state: SpriteGameState,
  frameSetName: SpriteFrameSetName,
  frameIndex: number,
): void {
  const frameSet = frameSetName === "walk" ? state.walkFrames : state.frames;
  const nextFrameIndex = clamp(frameIndex, 0, frameSet.length - 1);
  const nextImage = state.frameImages.get(getFrameKey(frameSetName, nextFrameIndex));

  if (state.currentFrameSet === frameSetName && state.currentFrameIndex === nextFrameIndex) {
    return;
  }

  if (!nextImage || !nextImage.complete || nextImage.naturalWidth === 0) {
    return;
  }

  state.currentFrameSet = frameSetName;
  state.currentFrameIndex = nextFrameIndex;
  state.activeImage.dataset.spriteFrameActive = "false";
  nextImage.dataset.spriteFrameActive = "true";
  state.activeImage = nextImage;
}

function updateFrame(state: SpriteGameState, now: number): void {
  if (!state.grounded) {
    showFrame(
      state,
      "default",
      state.vy < 0 ? Math.min(2, state.frames.length - 1) : state.frames.length - 1,
    );
    return;
  }

  if (Math.abs(state.vx) < 12) {
    showFrame(state, "default", 0);
    return;
  }

  if (state.currentFrameSet !== "walk") {
    state.lastFrameAt = now;
    showFrame(state, "walk", 0);
    return;
  }

  const holdMs = Math.max(state.walkFrames[state.currentFrameIndex]?.holdMs ?? 92, 60);

  if (now - state.lastFrameAt < holdMs) {
    return;
  }

  state.lastFrameAt = now;
  showFrame(state, "walk", (state.currentFrameIndex + 1) % state.walkFrames.length);
}

function moveToward(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
}

function getBottomFloorTop(): number {
  return window.innerHeight - BOTTOM_FLOOR_GAP_PX;
}

function spawnAtBottom(runner: HTMLElement, state: SpriteGameState): boolean {
  state.platforms = collectTextPlatforms(state.game);
  state.platformsDirty = false;

  const { height, width } = getRunnerSize(runner);
  const fallbackTargetX = window.innerWidth * state.game.spawnViewportXRatio;
  const targetX = Number.isFinite(state.x) ? state.x + width / 2 : fallbackTargetX;
  const floorTop = getBottomFloorTop();

  state.x = clamp(
    targetX - width / 2,
    VIEWPORT_PADDING_PX,
    window.innerWidth - width - VIEWPORT_PADDING_PX,
  );
  state.y = floorTop - height * state.game.footHeightRatio;
  state.vx = 0;
  state.vy = 0;
  state.grounded = true;
  state.currentPlatform = null;
  state.currentPlatformTop = floorTop;
  state.dropThroughPlatformTop = null;
  state.dropThroughUntil = 0;
  state.lastGroundedAt = performance.now();
  return true;
}

function requestDropThrough(state: SpriteGameState, now: number): void {
  if (!state.grounded || state.currentPlatformTop === null) {
    return;
  }

  if (state.currentPlatformTop >= getBottomFloorTop() - state.game.platformVerticalForgivenessPx) {
    return;
  }

  state.dropThroughPlatformTop = state.currentPlatformTop;
  state.dropThroughUntil = now + DROP_THROUGH_MS;
  state.currentPlatformTop = null;
  state.grounded = false;
  state.lastGroundedAt = 0;
  state.jumpQueuedUntil = 0;
  state.vy = Math.max(state.vy, state.game.gravityPxPerSecondSquared * 0.08);
  state.y += DROP_THROUGH_NUDGE_PX;
}

function shouldIgnorePlatformForDrop(
  state: SpriteGameState,
  platform: TextPlatform,
  now: number,
): boolean {
  if (state.dropThroughPlatformTop === null || now > state.dropThroughUntil) {
    state.dropThroughPlatformTop = null;
    state.dropThroughUntil = 0;
    return false;
  }

  return (
    Math.abs(platform.top - state.dropThroughPlatformTop) <=
    state.game.platformVerticalForgivenessPx + 2
  );
}

function stepPhysics(
  runner: HTMLElement,
  state: SpriteGameState,
  now: number,
  deltaSeconds: number,
): void {
  if (state.platformsDirty || hasDisconnectedPlatforms(state.platforms)) {
    state.platforms = collectTextPlatforms(state.game);
    state.platformsDirty = false;
  }

  const { height, width } = getRunnerSize(runner);
  const wasGrounded = state.grounded;
  const previousFootY = state.y + height * state.game.footHeightRatio;
  const leftPressed = state.keys.has("left");
  const rightPressed = state.keys.has("right");
  const targetVelocity =
    (rightPressed ? 1 : 0) * state.game.moveSpeedPxPerSecond -
    (leftPressed ? 1 : 0) * state.game.moveSpeedPxPerSecond;

  if (targetVelocity !== 0) {
    state.vx = moveToward(
      state.vx,
      targetVelocity,
      state.game.moveAccelerationPxPerSecondSquared * deltaSeconds,
    );
    state.facing = targetVelocity < 0 ? "left" : "right";
  } else {
    state.vx = moveToward(state.vx, 0, state.game.moveFrictionPxPerSecondSquared * deltaSeconds);
  }

  if (
    state.jumpQueuedUntil >= now &&
    (state.grounded || now - state.lastGroundedAt <= COYOTE_TIME_MS)
  ) {
    state.vy = -state.game.jumpVelocityPxPerSecond;
    state.grounded = false;
    state.jumpQueuedUntil = 0;
  }

  state.vy = Math.min(
    state.vy + state.game.gravityPxPerSecondSquared * deltaSeconds,
    state.game.maxFallPxPerSecond,
  );

  const nextX = clamp(
    state.x + state.vx * deltaSeconds,
    VIEWPORT_PADDING_PX,
    window.innerWidth - width - VIEWPORT_PADDING_PX,
  );
  let nextY = state.y + state.vy * deltaSeconds;
  let nextGrounded = false;
  let landingPlatform: TextPlatform | null = null;
  let landingVelocity = 0;

  if (state.vy >= 0) {
    const footSpan = getFootSpan(state, nextX, width);
    const nextFootY = nextY + height * state.game.footHeightRatio;

    for (const platform of state.platforms) {
      if (shouldIgnorePlatformForDrop(state, platform, now)) {
        continue;
      }

      const crossesPlatform =
        previousFootY <= platform.top + state.game.platformVerticalForgivenessPx &&
        nextFootY >= platform.top - state.game.platformVerticalForgivenessPx;
      const overlapsPlatform = footSpan.right >= platform.left && footSpan.left <= platform.right;

      if (!crossesPlatform || !overlapsPlatform) {
        continue;
      }

      nextY = platform.top - height * state.game.footHeightRatio;
      landingPlatform = platform;
      landingVelocity = state.vy;
      state.vy = 0;
      nextGrounded = true;
      state.currentPlatform = platform;
      state.currentPlatformTop = platform.top;
      state.dropThroughPlatformTop = null;
      state.dropThroughUntil = 0;
      state.lastGroundedAt = now;
      break;
    }

    if (!nextGrounded && nextFootY >= getBottomFloorTop()) {
      const floorTop = getBottomFloorTop();
      nextY = floorTop - height * state.game.footHeightRatio;
      state.vy = 0;
      nextGrounded = true;
      state.currentPlatform = null;
      state.currentPlatformTop = floorTop;
      state.dropThroughPlatformTop = null;
      state.dropThroughUntil = 0;
      state.lastGroundedAt = now;
    }
  }

  state.x = nextX;
  state.y = nextY;
  state.grounded = nextGrounded;
  if (!nextGrounded && state.vy !== 0) {
    state.currentPlatform = null;
    state.currentPlatformTop = null;
  }

  if (landingPlatform && !wasGrounded && landingVelocity >= LANDING_RIPPLE_MIN_VELOCITY) {
    triggerTextRipple(state, landingPlatform, nextX + width / 2, landingVelocity);
  }

  if (state.y > window.innerHeight + height * 0.35) {
    state.hasSpawned = spawnAtBottom(runner, state);
  }

  applyTextPressure(runner, state);
}

function startGame(runner: HTMLElement, state: SpriteGameState): void {
  if (state.active) {
    return;
  }

  state.active = true;
  state.lastTime = performance.now();
  runner.dataset.controlMode = "game";
  runner.dataset.motionState = "game";
  runner.dataset.state = "game";
  runner.dataset.gameState = "playing";
  runner.setAttribute(
    "aria-label",
    "Playable Luffy mini game. Use Left and Right arrow keys to move, Up to jump, Down to drop, Escape to pause.",
  );

  if (!state.hasSpawned) {
    state.hasSpawned = spawnAtBottom(runner, state);
  }

  renderRunner(runner, state);
  showFrame(state, "default", 0);

  const tick = (time: number) => {
    if (!state.active) {
      return;
    }

    const deltaSeconds = Math.min(Math.max((time - state.lastTime) / 1000, 0), 0.035);
    state.lastTime = time;
    stepPhysics(runner, state, time, deltaSeconds);
    updateFrame(state, time);
    renderRunner(runner, state);
    state.animationFrameId = window.requestAnimationFrame(tick);
  };

  state.animationFrameId = window.requestAnimationFrame(tick);
}

function pauseGame(runner: HTMLElement, state: SpriteGameState): void {
  state.active = false;
  state.keys.clear();
  state.jumpQueuedUntil = 0;
  clearTextPressure(state);
  clearRippleTimers(state);
  runner.dataset.gameState = "paused";

  if (state.animationFrameId !== null) {
    window.cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
}

function initSpriteRunner(runner: HTMLButtonElement): void {
  if (runner.dataset.spriteGameReady === "true") {
    return;
  }

  const activeImage = runner.querySelector("[data-sprite-image]");
  const configValue = runner.dataset.spriteConfig;

  if (!(activeImage instanceof HTMLImageElement) || !configValue) {
    return;
  }

  const payload = parseSpritePayload(configValue);

  if (!payload) {
    return;
  }

  runner.dataset.spriteReady = "true";
  runner.dataset.spriteGameReady = "true";
  runner.dataset.gameState = "idle";
  runner.title =
    "Start Luffy Mini Game. Use Left and Right arrows to move, Up to jump, Down to drop.";

  const frameImages = new Map<string, HTMLImageElement>();

  for (const image of runner.querySelectorAll("[data-sprite-frame-image]")) {
    if (!(image instanceof HTMLImageElement)) {
      continue;
    }

    const frameSet = image.dataset.spriteFrameSet;
    const frameIndex = Number(image.dataset.spriteFrameIndex);

    if ((frameSet === "default" || frameSet === "walk") && Number.isInteger(frameIndex)) {
      frameImages.set(getFrameKey(frameSet, frameIndex), image);
      void image.decode?.().catch(() => undefined);
    }
  }

  const initialRect = runner.getBoundingClientRect();
  const state: SpriteGameState = {
    active: false,
    activeImage,
    animationFrameId: null,
    currentFrameIndex: 0,
    currentFrameSet: "default",
    frameImages,
    currentPlatform: null,
    currentPlatformTop: null,
    dropThroughPlatformTop: null,
    dropThroughUntil: 0,
    facing: "left",
    frames: payload.frames,
    game: payload.game,
    grounded: false,
    hasSpawned: false,
    jumpQueuedUntil: 0,
    keys: new Set<ControlKey>(),
    lastFrameAt: performance.now(),
    lastGroundedAt: 0,
    lastTime: performance.now(),
    platforms: [],
    platformsDirty: true,
    pressuredElements: new Set<HTMLElement>(),
    rippleElements: new Set<HTMLElement>(),
    rippleTimers: [],
    rippleToken: 0,
    vx: 0,
    vy: 0,
    walkFrames: payload.walkFrames,
    x: initialRect.left,
    y: initialRect.top,
  };

  const markPlatformsDirty = () => {
    state.platformsDirty = true;
  };

  runner.addEventListener("click", () => {
    startGame(runner, state);
  });

  window.addEventListener(
    "keydown",
    (event) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const controlKey = getControlKey(event.key);

      if (!controlKey) {
        return;
      }

      event.preventDefault();

      if (controlKey === "escape") {
        pauseGame(runner, state);
        return;
      }

      startGame(runner, state);

      if (controlKey === "jump") {
        if (!event.repeat) {
          state.jumpQueuedUntil = performance.now() + JUMP_BUFFER_MS;
        }
        return;
      }

      if (controlKey === "down") {
        if (!event.repeat) {
          requestDropThrough(state, performance.now());
        }
        return;
      }

      state.keys.add(controlKey);
    },
    { passive: false },
  );

  window.addEventListener("keyup", (event) => {
    const controlKey = getControlKey(event.key);

    if (controlKey === "left" || controlKey === "right") {
      state.keys.delete(controlKey);
    }
  });

  window.addEventListener("scroll", markPlatformsDirty, { passive: true });
  window.addEventListener("resize", markPlatformsDirty);
  document.addEventListener("astro:page-load", markPlatformsDirty);

  if ("fonts" in document) {
    void document.fonts.ready.then(markPlatformsDirty);
  }
}

export function initSpriteGame(): void {
  const runners = document.querySelectorAll("[data-sprite-runner]");

  for (const runner of runners) {
    if (runner instanceof HTMLButtonElement) {
      initSpriteRunner(runner);
    }
  }
}
