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
  pressureTargetCache: WeakMap<HTMLElement, HTMLElement[]>;
  pressuredElements: Set<HTMLElement>;
  rippleElements: Set<HTMLElement>;
  ripplePlatformLine: HTMLElement | null;
  rippleTimers: number[];
  rippleToken: number;
  vx: number;
  vy: number;
  walkFrames: SpriteFrame[];
  x: number;
  y: number;
};

type EndlessPlatformKind = "plank" | "barrel" | "rope";
type EndlessPowerKind = "magnet" | "rescue" | "sail";

type EndlessPlatform = {
  element: HTMLElement;
  height: number;
  id: number;
  kind: EndlessPlatformKind;
  variant: number;
  vx: number;
  width: number;
  x: number;
  y: number;
};

type EndlessCoin = {
  collected: boolean;
  element: HTMLElement;
  id: number;
  variant: number;
  x: number;
  y: number;
};

type EndlessPowerUp = {
  collected: boolean;
  element: HTMLElement;
  id: number;
  kind: EndlessPowerKind;
  x: number;
  y: number;
};

type EndlessPlayerState = {
  height: number;
  vx: number;
  vy: number;
  width: number;
  x: number;
  y: number;
};

type EndlessGameState = {
  active: boolean;
  activeFrameElement: HTMLImageElement | null;
  animationFrameId: number | null;
  bestElement: HTMLElement;
  bestScore: number;
  coinLayer: HTMLElement;
  coins: EndlessCoin[];
  elapsedSeconds: number;
  field: HTMLElement;
  frameImages: Map<string, HTMLImageElement>;
  frames: SpriteFrame[];
  gameOver: boolean;
  gameOverElement: HTMLElement;
  jumpCount: number;
  keys: Set<ControlKey>;
  lastFrameAt: number;
  lastTime: number;
  currentFrameIndex: number;
  currentFrameSet: SpriteFrameSetName;
  messageCopyElement: HTMLElement;
  messageTitleElement: HTMLElement;
  nextId: number;
  overlay: HTMLElement;
  paused: boolean;
  platformLayer: HTMLElement;
  platforms: EndlessPlatform[];
  player: EndlessPlayerState;
  playerElement: HTMLElement;
  powerElement: HTMLElement;
  powerLayer: HTMLElement;
  powerUps: EndlessPowerUp[];
  rescueCharges: number;
  score: number;
  scoreElement: HTMLElement;
  speedElement: HTMLElement;
  statusElement: HTMLElement;
  magnetUntil: number;
  sailUntil: number;
  walkFrames: SpriteFrame[];
};

const TEXT_PLATFORM_SELECTOR = [
  "[data-blog-scene-root] .blog-scene-line-fragment",
  "[data-blog-scene-root] .blog-year-group__title",
  "[data-blog-scene-root] .archive-panel__count",
  "[data-blog-scene-root] .post-meta time",
  "[data-blog-scene-root] .post-meta span",
  "[data-blog-scene-root] .post-tags li",
  "[data-sprite-platform-root] .archive-panel__year",
  "[data-sprite-platform-root] .archive-panel__count",
  "[data-sprite-platform-root] .post-card__eyebrow span",
  "[data-sprite-platform-root] .post-card__eyebrow time",
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
const ENDLESS_BEST_SCORE_KEY = "by-me:luffy-endless-best-score";
const ENDLESS_DESPAWN_PADDING_PX = 90;
const ENDLESS_DEFAULT_PLAYER_SIZE_PX = 140;
const ENDLESS_POWERUP_SIZE_PX = 42;

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

function setRunnerData(runner: HTMLElement, key: string, value: string): void {
  if (runner.dataset[key] !== value) {
    runner.dataset[key] = value;
  }
}

function readStoredBestScore(): number {
  try {
    const value = window.localStorage.getItem(ENDLESS_BEST_SCORE_KEY);
    const score = value ? Number.parseInt(value, 10) : 0;
    return Number.isFinite(score) ? score : 0;
  } catch {
    return 0;
  }
}

function writeStoredBestScore(score: number): void {
  try {
    window.localStorage.setItem(ENDLESS_BEST_SCORE_KEY, String(score));
  } catch {
    // Best score persistence is nice-to-have; the game should still play without storage.
  }
}

function queryHTMLElement(root: ParentNode, selector: string): HTMLElement | null {
  const element = root.querySelector(selector);
  return element instanceof HTMLElement ? element : null;
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

function collectTextPlatforms(game: SpriteGameConfig, runner: HTMLElement): TextPlatform[] {
  const platforms: TextPlatform[] = [];
  const platformScope = runner.closest(".container") ?? document;
  const elements = Array.from(platformScope.querySelectorAll(TEXT_PLATFORM_SELECTOR));
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
  setRunnerData(runner, "facing", state.facing);
  setRunnerData(runner, "gameGrounded", String(state.grounded));
  setRunnerData(runner, "gamePlatformCount", String(state.platforms.length));
  setRunnerData(
    runner,
    "gameTextPlatform",
    state.currentPlatform?.element.textContent?.trim().slice(0, 80) ?? "",
  );
}

function getFrameKey(frameSetName: SpriteFrameSetName, frameIndex: number): string {
  return `${frameSetName}:${frameIndex}`;
}

function getTextPressureTargets(state: SpriteGameState, platform: TextPlatform): HTMLElement[] {
  const cachedTargets = state.pressureTargetCache.get(platform.lineElement);

  if (cachedTargets?.every((element) => element.isConnected)) {
    return cachedTargets;
  }

  let lineLetters = Array.from(
    platform.lineElement.querySelectorAll(".blog-scene-letter"),
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);

  if (lineLetters.length === 0) {
    lineLetters = ensureBlogSceneLetters(platform.lineElement);
  }

  if (lineLetters.length > 0) {
    state.pressureTargetCache.set(platform.lineElement, lineLetters);
    return lineLetters;
  }

  const fallbackTargets = [platform.element];
  state.pressureTargetCache.set(platform.lineElement, fallbackTargets);
  return fallbackTargets;
}

function resetTextPressureElement(element: HTMLElement): void {
  delete element.dataset.spriteTextPressure;
  element.style.removeProperty("--sprite-text-pressure-y");
  element.style.removeProperty("--sprite-text-pressure-rotate");
  element.style.removeProperty("--sprite-text-pressure-strength");
}

function resetTextRippleElement(element: HTMLElement): void {
  delete element.dataset.spriteTextRipple;
  element.style.removeProperty("--sprite-ripple-delay");
  element.style.removeProperty("--sprite-ripple-y");
  element.style.removeProperty("--sprite-ripple-rotate");
}

function isElementInTextLine(element: HTMLElement, lineElement: HTMLElement): boolean {
  return element === lineElement || lineElement.contains(element);
}

function clearTextEffectsOutsideLine(
  state: SpriteGameState,
  lineElement: HTMLElement | null,
): void {
  for (const element of Array.from(state.pressuredElements)) {
    if (!element.isConnected || !lineElement || !isElementInTextLine(element, lineElement)) {
      resetTextPressureElement(element);
      state.pressuredElements.delete(element);
    }
  }

  for (const element of Array.from(state.rippleElements)) {
    if (!element.isConnected || !lineElement || !isElementInTextLine(element, lineElement)) {
      resetTextRippleElement(element);
      state.rippleElements.delete(element);
    }
  }
}

function clearAllSpriteTextEffects(scope: ParentNode = document): void {
  const activeElements = scope.querySelectorAll(
    '[data-sprite-text-pressure="true"], [data-sprite-text-ripple="true"]',
  );

  for (const element of activeElements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    resetTextPressureElement(element);
    resetTextRippleElement(element);
  }
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
    clearRippleTimers(state);
    clearTextEffectsOutsideLine(state, null);
    return;
  }

  if (state.ripplePlatformLine && state.ripplePlatformLine !== platform.lineElement) {
    clearRippleTimers(state);
  }

  clearTextEffectsOutsideLine(state, platform.lineElement);

  const { width } = getRunnerSize(runner);
  const footCenterX = state.x + width / 2;
  const targets = getTextPressureTargets(state, platform);
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
    resetTextRippleElement(element);
  }

  state.rippleElements.clear();
  state.ripplePlatformLine = null;
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

  const targets = getTextPressureTargets(state, platform);

  if (targets.length === 0) {
    return;
  }

  const token = state.rippleToken + 1;
  const power = clamp(landingVelocity / state.game.maxFallPxPerSecond, 0.18, 0.72);
  let maxDelay = 0;

  state.rippleToken = token;
  clearRippleTimers(state);
  clearTextEffectsOutsideLine(state, platform.lineElement);
  state.ripplePlatformLine = platform.lineElement;

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
      resetTextRippleElement(target);
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
  state.platforms = collectTextPlatforms(state.game, runner);
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
    state.platforms = collectTextPlatforms(state.game, runner);
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
  if (state.active || !runner.isConnected) {
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

    if (!runner.isConnected) {
      pauseGame(runner, state);
      clearTextEffectsOutsideLine(state, null);
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

function setModePickerOpen(runner: HTMLButtonElement, picker: HTMLElement | null, open: boolean): void {
  if (!picker) {
    return;
  }

  picker.hidden = !open;
  runner.setAttribute("aria-expanded", String(open));
}

function getEndlessFieldSize(state: EndlessGameState): { height: number; width: number } {
  const rect = state.field.getBoundingClientRect();
  return {
    height: Math.max(rect.height, 360),
    width: Math.max(rect.width, 280),
  };
}

function getEndlessSpeed(state: EndlessGameState): number {
  return Math.min(104 + state.elapsedSeconds * 5.2 + state.jumpCount * 1.9, 334);
}

function getEndlessDifficulty(state: EndlessGameState): number {
  return clamp(state.elapsedSeconds / 48 + state.jumpCount / 60, 0, 1);
}

function clearEndlessEntities(state: EndlessGameState): void {
  for (const platform of state.platforms) {
    platform.element.remove();
  }

  for (const coin of state.coins) {
    coin.element.remove();
  }

  for (const powerUp of state.powerUps) {
    powerUp.element.remove();
  }

  state.platforms = [];
  state.coins = [];
  state.powerUps = [];
}

function createEndlessPlatform(
  state: EndlessGameState,
  y: number,
  forcedX?: number,
  forcedWidth?: number,
): EndlessPlatform {
  const { width: fieldWidth } = getEndlessFieldSize(state);
  const difficulty = getEndlessDifficulty(state);
  const kindRoll = Math.random();
  const kind: EndlessPlatformKind =
    kindRoll > 0.82 && difficulty > 0.25 ? "rope" : kindRoll > 0.64 ? "barrel" : "plank";
  const platformWidth =
    forcedWidth ??
    Math.round(
      kind === "barrel"
        ? 116 + Math.random() * 58
        : kind === "rope"
          ? 148 + Math.random() * 70
          : 136 - difficulty * 44 + Math.random() * (84 - difficulty * 30),
    );
  const platformHeight = kind === "barrel" ? 34 : kind === "rope" ? 22 : 26;
  const variant = kind === "plank" ? 1 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 2);
  const x =
    forcedX ??
    Math.round(
      VIEWPORT_PADDING_PX +
        Math.random() * Math.max(fieldWidth - platformWidth - VIEWPORT_PADDING_PX * 2, 1),
    );
  const platformElement = document.createElement("span");

  platformElement.className = `sprite-endless__platform sprite-endless__platform--${kind} sprite-endless__platform--${kind}-${variant}`;
  platformElement.dataset.endlessPlatform = kind;
  state.platformLayer.append(platformElement);

  return {
    element: platformElement,
    height: platformHeight,
    id: state.nextId++,
    kind,
    variant,
    vx:
      difficulty > 0.38 && Math.random() > 0.76
        ? (Math.random() > 0.5 ? 1 : -1) * (34 + difficulty * 46)
        : 0,
    width: platformWidth,
    x,
    y,
  };
}

function getEndlessPowerLabel(state: EndlessGameState): string {
  const now = performance.now();
  const labels: string[] = [];

  if (state.sailUntil > now) {
    labels.push("Sail");
  }

  if (state.magnetUntil > now) {
    labels.push("Magnet");
  }

  if (state.rescueCharges > 0) {
    labels.push("Rescue");
  }

  return labels.length > 0 ? labels.join(" + ") : "None";
}

function seedEndlessPlatforms(
  state: EndlessGameState,
  startX?: number,
  startPlatformY?: number,
): void {
  clearEndlessEntities(state);
  const { height, width } = getEndlessFieldSize(state);
  const startPlatformWidth = 176;
  const safeStartY = clamp(startPlatformY ?? height - 96, 120, height - 74);
  const safeStartX = clamp(
    (startX ?? width / 2) - startPlatformWidth / 2,
    VIEWPORT_PADDING_PX,
    width - startPlatformWidth - VIEWPORT_PADDING_PX,
  );
  const startPlatform = createEndlessPlatform(state, safeStartY, safeStartX, startPlatformWidth);

  state.platforms.push(startPlatform);

  let y = safeStartY - 96;
  let anchorX = safeStartX + startPlatformWidth / 2;

  while (y > -ENDLESS_DESPAWN_PADDING_PX) {
    const platform = createEndlessPlatform(state, y);
    const drift = (Math.random() - 0.5) * 246;
    anchorX = clamp(anchorX + drift, platform.width / 2 + 10, width - platform.width / 2 - 10);
    platform.x = Math.round(anchorX - platform.width / 2);
    state.platforms.push(platform);
    y -= 80 + Math.random() * 38;
  }
}

function spawnEndlessPlatforms(state: EndlessGameState): void {
  const highestPlatform = state.platforms.reduce<EndlessPlatform | null>(
    (highest, platform) => (!highest || platform.y < highest.y ? platform : highest),
    null,
  );

  if (!highestPlatform || highestPlatform.y < -68) {
    return;
  }

  const { width } = getEndlessFieldSize(state);
  const difficulty = getEndlessDifficulty(state);
  const gap = 82 + Math.random() * (42 + difficulty * 32);
  const platform = createEndlessPlatform(state, highestPlatform.y - gap);
  const anchorX = highestPlatform.x + highestPlatform.width / 2;
  const horizontalDrift = (Math.random() - 0.5) * (254 + difficulty * 164);
  const nextCenterX = clamp(
    anchorX + horizontalDrift,
    platform.width / 2 + 10,
    width - platform.width / 2 - 10,
  );

  platform.x = Math.round(nextCenterX - platform.width / 2);
  state.platforms.push(platform);
}

function updateEndlessHud(state: EndlessGameState): void {
  state.scoreElement.textContent = String(Math.max(0, Math.floor(state.score)));
  state.bestElement.textContent = String(state.bestScore);
  state.speedElement.textContent = `${(getEndlessSpeed(state) / 118).toFixed(1)}x`;
  state.powerElement.textContent = getEndlessPowerLabel(state);
}

function renderEndlessGame(state: EndlessGameState): void {
  const facing = state.player.vx < -8 ? -1 : 1;
  const frameSetName: SpriteFrameSetName = Math.abs(state.player.vx) > 24 ? "walk" : "default";
  const frameList = frameSetName === "walk" ? state.walkFrames : state.frames;
  const frameIndex =
    Math.abs(state.player.vx) > 24
      ? Math.floor(state.elapsedSeconds * 11) % frameList.length
      : state.player.vy < 0
        ? Math.min(1, frameList.length - 1)
        : Math.min(3, frameList.length - 1);
  const frameElement = state.frameImages.get(getFrameKey(frameSetName, frameIndex));

  if (
    frameElement &&
    (state.currentFrameSet !== frameSetName ||
      state.currentFrameIndex !== frameIndex ||
      state.activeFrameElement !== frameElement)
  ) {
    if (state.activeFrameElement) {
      state.activeFrameElement.dataset.spriteEndlessFrameActive = "false";
    }

    frameElement.dataset.spriteEndlessFrameActive = "true";
    state.activeFrameElement = frameElement;
    state.currentFrameSet = frameSetName;
    state.currentFrameIndex = frameIndex;
  }

  state.playerElement.style.width = `${state.player.width}px`;
  state.playerElement.style.height = `${state.player.height}px`;
  state.playerElement.style.transform = `translate3d(${state.player.x.toFixed(2)}px, ${state.player.y.toFixed(2)}px, 0) scaleX(${facing})`;

  for (const platform of state.platforms) {
    platform.element.style.width = `${platform.width}px`;
    platform.element.style.height = `${platform.height}px`;
    platform.element.style.transform = `translate3d(${platform.x.toFixed(2)}px, ${platform.y.toFixed(2)}px, 0)`;
  }

  for (const coin of state.coins) {
    coin.element.hidden = coin.collected;
    coin.element.style.transform = `translate3d(${coin.x.toFixed(2)}px, ${coin.y.toFixed(2)}px, 0)`;
  }

  for (const powerUp of state.powerUps) {
    powerUp.element.hidden = powerUp.collected;
    powerUp.element.style.transform = `translate3d(${powerUp.x.toFixed(2)}px, ${powerUp.y.toFixed(2)}px, 0)`;
  }

  updateEndlessHud(state);
}

function setEndlessMessage(
  state: EndlessGameState,
  title: string,
  copy: string,
  visible: boolean,
): void {
  state.gameOverElement.hidden = !visible;
  state.messageTitleElement.textContent = title;
  state.messageCopyElement.textContent = copy;
}

function resetEndlessGame(state: EndlessGameState, runnerRect?: DOMRect): void {
  const { height, width } = getEndlessFieldSize(state);
  const playerWidth = Math.round(runnerRect?.width ?? ENDLESS_DEFAULT_PLAYER_SIZE_PX);
  const playerHeight = Math.round(runnerRect?.height ?? ENDLESS_DEFAULT_PLAYER_SIZE_PX);
  const spawnCenterX = width / 2;
  const spawnTop = height - playerHeight - 126;
  const spawnY = clamp(spawnTop, 24, height - playerHeight - 78);

  state.active = true;
  state.paused = false;
  state.gameOver = false;
  state.elapsedSeconds = 0;
  state.jumpCount = 0;
  state.magnetUntil = 0;
  state.rescueCharges = 0;
  state.sailUntil = 0;
  state.score = 0;
  state.lastTime = performance.now();
  state.keys.clear();
  state.player = {
    height: playerHeight,
    vx: 0,
    vy: -860,
    width: playerWidth,
    x: clamp(spawnCenterX - playerWidth / 2, 4, width - playerWidth - 4),
    y: spawnY,
  };
  state.statusElement.textContent = "Use left and right. Land to bounce.";
  setEndlessMessage(state, "Game Over", "Fell into the water.", false);
  seedEndlessPlatforms(state, spawnCenterX, spawnY + playerHeight - 4);
  renderEndlessGame(state);
}

function endEndlessGame(state: EndlessGameState): void {
  state.active = false;
  state.gameOver = true;
  state.keys.clear();
  state.bestScore = Math.max(state.bestScore, Math.floor(state.score));
  writeStoredBestScore(state.bestScore);
  state.statusElement.textContent = "Game over. Restart or stop.";
  setEndlessMessage(state, "Game Over", "Fell into the water.", true);

  if (state.animationFrameId !== null) {
    window.cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }

  updateEndlessHud(state);
}

function rescueEndlessPlayer(state: EndlessGameState): void {
  const { height, width } = getEndlessFieldSize(state);
  const rescuePlatform = createEndlessPlatform(state, height - 118, width / 2 - 96, 192);

  state.platforms.push(rescuePlatform);
  state.player.x = rescuePlatform.x + rescuePlatform.width / 2 - state.player.width / 2;
  state.player.y = rescuePlatform.y - state.player.height - 2;
  state.player.vx = 0;
  state.player.vy = -940;
  state.rescueCharges -= 1;
  state.statusElement.textContent = "Lifebuoy rescue!";
  state.score += 110;
}

function stopEndlessGame(runner: HTMLElement, state: EndlessGameState): void {
  state.active = false;
  state.paused = false;
  state.gameOver = false;
  state.keys.clear();
  state.overlay.hidden = true;
  state.overlay.setAttribute("aria-hidden", "true");
  clearEndlessEntities(state);
  delete document.documentElement.dataset.spriteEndlessActive;
  delete runner.dataset.controlMode;
  runner.dataset.gameState = "idle";
  runner.dataset.motionState = "idle";
  runner.dataset.state = "idle";
  runner.setAttribute("aria-label", "Open Luffy Mini Game modes.");

  if (state.animationFrameId !== null) {
    window.cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
}

function stepEndlessGame(state: EndlessGameState, now: number): void {
  if (!state.active || state.paused || state.gameOver) {
    return;
  }

  const { height, width } = getEndlessFieldSize(state);
  const deltaSeconds = Math.min(Math.max((now - state.lastTime) / 1000, 0), 0.035);
  const previousBottom = state.player.y + state.player.height;
  const platformSpeed = getEndlessSpeed(state);
  const nowMs = performance.now();
  const hasSail = state.sailUntil > nowMs;
  const hasMagnet = state.magnetUntil > nowMs;
  const leftPressed = state.keys.has("left");
  const rightPressed = state.keys.has("right");
  const moveSpeed = hasSail ? 460 : 360;
  const targetVelocity = (rightPressed ? 1 : 0) * moveSpeed - (leftPressed ? 1 : 0) * moveSpeed;

  state.lastTime = now;
  state.elapsedSeconds += deltaSeconds;
  state.score += deltaSeconds * (9 + platformSpeed / 42);

  if (targetVelocity !== 0) {
    state.player.vx = moveToward(state.player.vx, targetVelocity, (hasSail ? 4300 : 3200) * deltaSeconds);
  } else {
    state.player.vx = moveToward(state.player.vx, 0, (hasSail ? 3400 : 2600) * deltaSeconds);
  }

  state.player.vy = Math.min(state.player.vy + (hasSail ? 1950 : 2250) * deltaSeconds, 1420);
  state.player.x = clamp(state.player.x + state.player.vx * deltaSeconds, 4, width - state.player.width - 4);
  state.player.y += state.player.vy * deltaSeconds;

  const cameraTop = height * 0.36;

  if (state.player.y < cameraTop) {
    const cameraShift = cameraTop - state.player.y;

    state.player.y = cameraTop;
    state.score += cameraShift * 0.08;

    for (const platform of state.platforms) {
      platform.y += cameraShift;
    }

    for (const coin of state.coins) {
      coin.y += cameraShift;
    }

    for (const powerUp of state.powerUps) {
      powerUp.y += cameraShift;
    }
  }

  for (const platform of state.platforms) {
    platform.y += platformSpeed * deltaSeconds;

    if (platform.vx !== 0) {
      platform.x += platform.vx * deltaSeconds;
      if (platform.x < 6 || platform.x + platform.width > width - 6) {
        platform.vx *= -1;
        platform.x = clamp(platform.x, 6, width - platform.width - 6);
      }
    }
  }

  for (const coin of state.coins) {
    coin.y += platformSpeed * deltaSeconds;

    if (hasMagnet && !coin.collected) {
      const dx = state.player.x + state.player.width / 2 - coin.x;
      const dy = state.player.y + state.player.height / 2 - coin.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 150 && distance > 1) {
        coin.x += (dx / distance) * 260 * deltaSeconds;
        coin.y += (dy / distance) * 260 * deltaSeconds;
      }
    }
  }

  for (const powerUp of state.powerUps) {
    powerUp.y += platformSpeed * deltaSeconds;
  }

  if (state.player.vy > 0) {
    const nextBottom = state.player.y + state.player.height;
    const footLeft = state.player.x + state.player.width * 0.24;
    const footRight = state.player.x + state.player.width * 0.76;

    for (const platform of state.platforms) {
      const platformTop = platform.y;
      const crossesPlatform = previousBottom <= platformTop + 8 && nextBottom >= platformTop - 8;
      const overlapsPlatform = footRight >= platform.x && footLeft <= platform.x + platform.width;

      if (!crossesPlatform || !overlapsPlatform) {
        continue;
      }

      state.player.y = platformTop - state.player.height;
      state.player.vy = (hasSail ? -970 : -880) - getEndlessDifficulty(state) * 80;
      state.jumpCount += 1;
      state.score += 18;
      break;
    }
  }

  for (const coin of state.coins) {
    if (coin.collected) {
      continue;
    }

    const coinCenterX = coin.x + 10;
    const coinCenterY = coin.y + 10;
    const overlapsCoin =
      coinCenterX >= state.player.x &&
      coinCenterX <= state.player.x + state.player.width &&
      coinCenterY >= state.player.y &&
      coinCenterY <= state.player.y + state.player.height;

    if (overlapsCoin) {
      coin.collected = true;
      state.score += 65;
    }
  }

  for (const powerUp of state.powerUps) {
    if (powerUp.collected) {
      continue;
    }

    const powerCenterX = powerUp.x + ENDLESS_POWERUP_SIZE_PX / 2;
    const powerCenterY = powerUp.y + ENDLESS_POWERUP_SIZE_PX / 2;
    const overlapsPower =
      powerCenterX >= state.player.x &&
      powerCenterX <= state.player.x + state.player.width &&
      powerCenterY >= state.player.y &&
      powerCenterY <= state.player.y + state.player.height;

    if (!overlapsPower) {
      continue;
    }

    powerUp.collected = true;
    state.score += 95;

    if (powerUp.kind === "sail") {
      state.sailUntil = Math.max(state.sailUntil, nowMs) + 6200;
      state.statusElement.textContent = "Sail boost!";
    } else if (powerUp.kind === "magnet") {
      state.magnetUntil = Math.max(state.magnetUntil, nowMs) + 7200;
      state.statusElement.textContent = "Coin magnet!";
    } else {
      state.rescueCharges = Math.min(state.rescueCharges + 1, 1);
      state.statusElement.textContent = "Lifebuoy ready.";
    }
  }

  for (const platform of state.platforms.filter(
    (platform) => platform.y > height + ENDLESS_DESPAWN_PADDING_PX,
  )) {
    platform.element.remove();
  }

  for (const coin of state.coins.filter((coin) => coin.y > height + ENDLESS_DESPAWN_PADDING_PX)) {
    coin.element.remove();
  }

  for (const powerUp of state.powerUps.filter(
    (powerUp) => powerUp.y > height + ENDLESS_DESPAWN_PADDING_PX,
  )) {
    powerUp.element.remove();
  }

  state.platforms = state.platforms.filter(
    (platform) => platform.y <= height + ENDLESS_DESPAWN_PADDING_PX,
  );
  state.coins = state.coins.filter((coin) => coin.y <= height + ENDLESS_DESPAWN_PADDING_PX);
  state.powerUps = state.powerUps.filter(
    (powerUp) => powerUp.y <= height + ENDLESS_DESPAWN_PADDING_PX,
  );
  spawnEndlessPlatforms(state);

  if (state.player.y > height + 24) {
    if (state.rescueCharges > 0) {
      rescueEndlessPlayer(state);
      renderEndlessGame(state);
      state.animationFrameId = window.requestAnimationFrame((time) => stepEndlessGame(state, time));
      return;
    }

    endEndlessGame(state);
    renderEndlessGame(state);
    return;
  }

  renderEndlessGame(state);
  state.animationFrameId = window.requestAnimationFrame((time) => stepEndlessGame(state, time));
}

function startEndlessGame(runner: HTMLElement, state: EndlessGameState): void {
  const runnerRect = runner.getBoundingClientRect();

  state.overlay.hidden = false;
  state.overlay.setAttribute("aria-hidden", "false");
  document.documentElement.dataset.spriteEndlessActive = "true";
  runner.dataset.controlMode = "endless";
  runner.dataset.gameState = "playing";
  runner.dataset.motionState = "endless";
  runner.dataset.state = "endless";
  runner.setAttribute("aria-label", "Endless Jump is running.");
  resetEndlessGame(state, runnerRect);

  if (state.animationFrameId !== null) {
    window.cancelAnimationFrame(state.animationFrameId);
  }

  state.animationFrameId = window.requestAnimationFrame((time) => stepEndlessGame(state, time));
}

function toggleEndlessPause(state: EndlessGameState): void {
  if (!state.active || state.gameOver) {
    return;
  }

  state.paused = !state.paused;
  state.statusElement.textContent = state.paused ? "Paused." : "Use left and right. Land to bounce.";

  if (!state.paused) {
    state.lastTime = performance.now();
    state.animationFrameId = window.requestAnimationFrame((time) => stepEndlessGame(state, time));
  }
}

function isEndlessOpen(state: EndlessGameState | null): state is EndlessGameState {
  return state !== null && !state.overlay.hidden;
}

function createEndlessGame(runner: HTMLElement, payload: SpritePayload): EndlessGameState | null {
  const shell = runner.closest("[data-sprite-game-shell]");
  const overlay = shell ? queryHTMLElement(shell, "[data-sprite-endless-overlay]") : null;
  const field = shell ? queryHTMLElement(shell, "[data-sprite-endless-field]") : null;
  const platformLayer = shell ? queryHTMLElement(shell, "[data-sprite-endless-platforms]") : null;
  const coinLayer = shell ? queryHTMLElement(shell, "[data-sprite-endless-coins]") : null;
  const powerLayer = shell ? queryHTMLElement(shell, "[data-sprite-endless-powerups]") : null;
  const playerElement = shell ? queryHTMLElement(shell, "[data-sprite-endless-player]") : null;
  const scoreElement = shell ? queryHTMLElement(shell, "[data-sprite-endless-score]") : null;
  const bestElement = shell ? queryHTMLElement(shell, "[data-sprite-endless-best]") : null;
  const speedElement = shell ? queryHTMLElement(shell, "[data-sprite-endless-speed]") : null;
  const powerElement = shell ? queryHTMLElement(shell, "[data-sprite-endless-power]") : null;
  const statusElement = shell ? queryHTMLElement(shell, "[data-sprite-endless-status]") : null;
  const gameOverElement = shell ? queryHTMLElement(shell, "[data-sprite-endless-message]") : null;
  const messageTitleElement = shell
    ? queryHTMLElement(shell, "[data-sprite-endless-message-title]")
    : null;
  const messageCopyElement = shell
    ? queryHTMLElement(shell, "[data-sprite-endless-message-copy]")
    : null;
  const frameImages = new Map<string, HTMLImageElement>();
  let activeFrameElement: HTMLImageElement | null = null;

  if (shell) {
    for (const image of shell.querySelectorAll("[data-sprite-endless-frame-image]")) {
      if (!(image instanceof HTMLImageElement)) {
        continue;
      }

      const frameSet = image.dataset.spriteFrameSet;
      const frameIndex = Number(image.dataset.spriteFrameIndex);

      if ((frameSet === "default" || frameSet === "walk") && Number.isInteger(frameIndex)) {
        frameImages.set(getFrameKey(frameSet, frameIndex), image);
        void image.decode?.().catch(() => undefined);

        if (image.dataset.spriteEndlessFrameActive === "true") {
          activeFrameElement = image;
        }
      }
    }
  }

  if (
    !(
      overlay &&
      field &&
      platformLayer &&
      coinLayer &&
      powerLayer &&
      playerElement &&
      scoreElement &&
      bestElement &&
      speedElement &&
      powerElement &&
      statusElement &&
      gameOverElement &&
      messageTitleElement &&
      messageCopyElement &&
      frameImages.size > 0
    )
  ) {
    return null;
  }

  const state: EndlessGameState = {
    active: false,
    activeFrameElement,
    animationFrameId: null,
    bestElement,
    bestScore: readStoredBestScore(),
    coinLayer,
    coins: [],
    elapsedSeconds: 0,
    field,
    frameImages,
    frames: payload.frames,
    gameOver: false,
    gameOverElement,
    jumpCount: 0,
    keys: new Set<ControlKey>(),
    lastFrameAt: performance.now(),
    lastTime: performance.now(),
    currentFrameIndex: 0,
    currentFrameSet: "default",
    messageCopyElement,
    messageTitleElement,
    nextId: 1,
    overlay,
    paused: false,
    platformLayer,
    platforms: [],
    player: { height: 72, vx: 0, vy: 0, width: 58, x: 0, y: 0 },
    playerElement,
    powerElement,
    powerLayer,
    powerUps: [],
    rescueCharges: 0,
    score: 0,
    scoreElement,
    speedElement,
    statusElement,
    magnetUntil: 0,
    sailUntil: 0,
    walkFrames: payload.walkFrames,
  };

  updateEndlessHud(state);
  return state;
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
  runner.title = "Open Luffy Mini Game modes.";
  const shell = runner.closest("[data-sprite-game-shell]");
  const modePicker = shell ? queryHTMLElement(shell, "[data-sprite-mode-picker]") : null;
  const endlessState = createEndlessGame(runner, payload);
  const pauseButton = shell ? queryHTMLElement(shell, "[data-sprite-endless-pause]") : null;
  const restartButton = shell ? queryHTMLElement(shell, "[data-sprite-endless-restart]") : null;
  const closeButton = shell ? queryHTMLElement(shell, "[data-sprite-endless-close]") : null;
  const stopButton = shell ? queryHTMLElement(shell, "[data-sprite-endless-stop]") : null;
  const messageRestartButton = shell
    ? queryHTMLElement(shell, "[data-sprite-endless-message-restart]")
    : null;

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
    pressureTargetCache: new WeakMap<HTMLElement, HTMLElement[]>(),
    pressuredElements: new Set<HTMLElement>(),
    rippleElements: new Set<HTMLElement>(),
    ripplePlatformLine: null,
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
    if (isEndlessOpen(endlessState)) {
      return;
    }

    setModePickerOpen(runner, modePicker, modePicker?.hidden ?? true);
  });

  modePicker?.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const choice = target.closest("[data-sprite-mode-choice]");

    if (!(choice instanceof HTMLElement)) {
      return;
    }

    const mode = choice.dataset.spriteModeChoice;
    setModePickerOpen(runner, modePicker, false);

    if (mode === "explore") {
      if (isEndlessOpen(endlessState)) {
        stopEndlessGame(runner, endlessState);
      }
      startGame(runner, state);
    } else if (mode === "endless" && endlessState) {
      pauseGame(runner, state);
      startEndlessGame(runner, endlessState);
    }
  });

  pauseButton?.addEventListener("click", () => {
    if (endlessState) {
      toggleEndlessPause(endlessState);
    }
  });

  restartButton?.addEventListener("click", () => {
    if (endlessState) {
      startEndlessGame(runner, endlessState);
    }
  });

  messageRestartButton?.addEventListener("click", () => {
    if (endlessState) {
      startEndlessGame(runner, endlessState);
    }
  });

  closeButton?.addEventListener("click", () => {
    if (endlessState) {
      stopEndlessGame(runner, endlessState);
    }
  });

  stopButton?.addEventListener("click", () => {
    if (endlessState) {
      stopEndlessGame(runner, endlessState);
    }
  });

  window.addEventListener(
    "keydown",
    (event) => {
      if (!runner.isConnected) {
        pauseGame(runner, state);
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      const controlKey = getControlKey(event.key);

      if (!controlKey) {
        return;
      }

      event.preventDefault();

      if (isEndlessOpen(endlessState)) {
        if (controlKey === "escape") {
          toggleEndlessPause(endlessState);
          return;
        }

        if (controlKey === "left" || controlKey === "right") {
          endlessState.keys.add(controlKey);
        }
        return;
      }

      if (!modePicker?.hidden) {
        if (controlKey === "escape") {
          setModePickerOpen(runner, modePicker, false);
        }
        return;
      }

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
    if (!runner.isConnected) {
      pauseGame(runner, state);
      return;
    }

    const controlKey = getControlKey(event.key);

    if (isEndlessOpen(endlessState)) {
      if (controlKey === "left" || controlKey === "right") {
        endlessState.keys.delete(controlKey);
      }
      return;
    }

    if (controlKey === "left" || controlKey === "right") {
      state.keys.delete(controlKey);
    }
  });

  window.addEventListener("scroll", markPlatformsDirty, { passive: true });
  window.addEventListener("resize", markPlatformsDirty);
  document.addEventListener("astro:page-load", markPlatformsDirty);
  document.addEventListener("astro:before-swap", () => {
    pauseGame(runner, state);
    if (endlessState) {
      stopEndlessGame(runner, endlessState);
    }
    clearTextEffectsOutsideLine(state, null);
    clearAllSpriteTextEffects(runner.closest(".container") ?? document);
  });

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
