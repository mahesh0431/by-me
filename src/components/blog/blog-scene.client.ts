import {
  layoutNextLine,
  prepareWithSegments,
  setLocale,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";

import {
  buildSpriteAlphaHull,
  type SpriteAlphaHull,
  type SpriteAlphaHullOptions,
} from "./sprite-alpha-hull";
import type { BlogScenePost, BlogSceneYearGroup } from "./blog-scene.types";

type BlogScenePostState = {
  cardElement: HTMLElement;
  descriptionElement: HTMLParagraphElement;
  post: BlogScenePost;
  preparedDescription: PreparedTextWithSegments;
  preparedTitle: PreparedTextWithSegments;
  titleBlockElement: HTMLElement;
  titleElement: HTMLAnchorElement;
};

type BlogSceneState = {
  groups: BlogSceneYearGroup[];
  postStates: BlogScenePostState[];
  root: HTMLElement;
  spriteShape?: BlogSceneSpriteShapeState;
  yearHeadingElements: HTMLHeadingElement[];
};

type BlogSceneSpriteShapeState = {
  frameIndex: number;
  hull: SpriteAlphaHull;
  runnerElement: HTMLElement;
  src: string;
};

type SpriteShapeRequest = {
  frameIndex: number;
  options: SpriteAlphaHullOptions;
  runnerElement: HTMLElement;
  src: string;
};

type SpriteLayoutContext = {
  boundsRect: TextRect;
  hull: SpriteAlphaHull;
  runnerElement: HTMLElement;
  runnerRect: DOMRect;
};

type TextInterval = {
  left: number;
  right: number;
};

type TextRect = TextInterval & {
  bottom: number;
  height: number;
  top: number;
  width: number;
};

type RenderLine = {
  fragments: RenderFragment[];
  usesExclusion: boolean;
};

type RenderFragment = {
  justifyWordSpacing: number | null;
  offset: number;
  renderWidth: number;
  slotWidth: number;
  text: string;
  width: number;
};

const sceneStates = new WeakMap<HTMLElement, BlogSceneState>();
const sceneRoots = new Set<HTMLElement>();

let activeLocale: string | null = null;
let didBindResize = false;
let resizeFrameId: number | null = null;
let spriteMotionFrameId: number | null = null;
let textMeasureContext: CanvasRenderingContext2D | null = null;

function syncLocale(): void {
  const nextLocale = document.documentElement.lang || navigator.language || null;

  if (nextLocale === activeLocale) {
    return;
  }

  setLocale(nextLocale ?? undefined);
  activeLocale = nextLocale;
}

function parseSceneGroups(root: HTMLElement): BlogSceneYearGroup[] | null {
  const dataElement = root.querySelector("[data-blog-scene-data]");

  if (!(dataElement instanceof HTMLScriptElement) || !dataElement.textContent) {
    return null;
  }

  try {
    const parsed = JSON.parse(dataElement.textContent);
    return Array.isArray(parsed) ? (parsed as BlogSceneYearGroup[]) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function parseSpriteRunnerConfig(runner: HTMLElement): Record<string, unknown> | null {
  const configValue = runner.dataset.spriteConfig;

  if (!configValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(configValue);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function pickLoopFrameIndex(phases: unknown, framesLength: number): number {
  if (!Array.isArray(phases)) {
    return 0;
  }

  for (const phase of phases) {
    if (!isRecord(phase) || phase.repeat !== "infinite" || !Array.isArray(phase.frameIndexes)) {
      continue;
    }

    for (const frameIndex of phase.frameIndexes) {
      if (Number.isInteger(frameIndex) && frameIndex >= 0 && frameIndex < framesLength) {
        return frameIndex;
      }
    }
  }

  return 0;
}

function getSpriteShapeRequest(): SpriteShapeRequest | null {
  const runnerElement = document.querySelector("[data-sprite-runner]");

  if (!(runnerElement instanceof HTMLElement)) {
    return null;
  }

  const config = parseSpriteRunnerConfig(runnerElement);

  if (!config || !Array.isArray(config.frames) || config.frames.length === 0) {
    return null;
  }

  const shape = isRecord(config.shape) ? config.shape : {};
  const configuredFrameIndex = readNumber(shape.frameIndex);
  const fallbackFrameIndex = pickLoopFrameIndex(config.phases, config.frames.length);
  const frameIndex =
    configuredFrameIndex !== undefined &&
    Number.isInteger(configuredFrameIndex) &&
    configuredFrameIndex >= 0 &&
    configuredFrameIndex < config.frames.length
      ? configuredFrameIndex
      : fallbackFrameIndex;
  const frame = config.frames[frameIndex];

  if (!isRecord(frame) || typeof frame.src !== "string" || frame.src.length === 0) {
    return null;
  }

  return {
    frameIndex,
    options: {
      alphaThreshold: readNumber(shape.alphaThreshold),
      horizontalPaddingRatio: readNumber(shape.horizontalPaddingRatio),
      maxDimension: readNumber(shape.maxDimension),
      sampleCount: readNumber(shape.sampleCount),
      smoothRadius: readNumber(shape.smoothRadius),
      verticalPaddingRatio: readNumber(shape.verticalPaddingRatio),
    },
    runnerElement,
    src: frame.src,
  };
}

function getTextFont(style: CSSStyleDeclaration): string {
  if (style.font) {
    return style.font;
  }

  return `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} / ${style.lineHeight} ${style.fontFamily}`;
}

function getDescriptionElement(cardElement: HTMLElement): HTMLParagraphElement | null {
  const explicitDescription = cardElement.querySelector(".post-card__description");

  if (explicitDescription instanceof HTMLParagraphElement) {
    return explicitDescription;
  }

  for (const child of cardElement.children) {
    if (child instanceof HTMLParagraphElement) {
      return child;
    }
  }

  return null;
}

function getRenderWidth(element: HTMLElement): number {
  return Math.max(element.getBoundingClientRect().width, 1);
}

function getTextMeasureContext(): CanvasRenderingContext2D | null {
  if (textMeasureContext) {
    return textMeasureContext;
  }

  const canvas = document.createElement("canvas");
  textMeasureContext = canvas.getContext("2d");
  return textMeasureContext;
}

function measureTextWidth(text: string, font: string, fallbackWidth: number): number {
  const context = getTextMeasureContext();

  if (!context) {
    return fallbackWidth;
  }

  context.font = font;
  return context.measureText(text).width;
}

function getLineHeight(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight);

  if (Number.isFinite(lineHeight)) {
    return lineHeight;
  }

  const fontSize = Number.parseFloat(style.fontSize);
  return Number.isFinite(fontSize) ? fontSize * 1.2 : 20;
}

function getSpriteLayoutContext(state: BlogSceneState): SpriteLayoutContext | null {
  const spriteShape = state.spriteShape;

  if (!spriteShape || !spriteShape.runnerElement.isConnected) {
    return null;
  }

  if (
    spriteShape.runnerElement.dataset.motionState !== "moving" &&
    spriteShape.runnerElement.dataset.motionState !== "settled"
  ) {
    return null;
  }

  const runnerRect = spriteShape.runnerElement.getBoundingClientRect();

  if (runnerRect.width <= 0 || runnerRect.height <= 0) {
    return null;
  }

  const bounds = spriteShape.hull.bounds;
  const left = runnerRect.left + bounds.x * runnerRect.width;
  const right = left + bounds.width * runnerRect.width;
  const top = runnerRect.top + bounds.y * runnerRect.height;
  const bottom = top + bounds.height * runnerRect.height;

  return {
    boundsRect: {
      bottom,
      height: bottom - top,
      left,
      right,
      top,
      width: right - left,
    },
    hull: spriteShape.hull,
    runnerElement: spriteShape.runnerElement,
    runnerRect,
  };
}

function rectsOverlap(left: DOMRect | TextRect, right: TextRect, margin = 0): boolean {
  return (
    left.right >= right.left - margin &&
    left.left <= right.right + margin &&
    left.bottom >= right.top - margin &&
    left.top <= right.bottom + margin
  );
}

function getBlockedIntervalForBand(context: SpriteLayoutContext, bandTop: number, bandBottom: number): TextInterval | null {
  if (bandBottom < context.boundsRect.top || bandTop > context.boundsRect.bottom) {
    return null;
  }

  let left = Infinity;
  let right = -Infinity;
  let didSample = false;

  for (const slice of context.hull.slices) {
    const sliceY = context.runnerRect.top + slice.y * context.runnerRect.height;

    if (sliceY < bandTop || sliceY > bandBottom) {
      continue;
    }

    didSample = true;
    left = Math.min(left, context.runnerRect.left + slice.left * context.runnerRect.width);
    right = Math.max(right, context.runnerRect.left + slice.right * context.runnerRect.width);
  }

  if (!didSample) {
    const bandCenter = (bandTop + bandBottom) / 2;
    let nearestSlice = context.hull.slices[0];
    let nearestDistance = Infinity;

    for (const slice of context.hull.slices) {
      const sliceY = context.runnerRect.top + slice.y * context.runnerRect.height;
      const distance = Math.abs(sliceY - bandCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestSlice = slice;
      }
    }

    if (!nearestSlice) {
      return null;
    }

    left = context.runnerRect.left + nearestSlice.left * context.runnerRect.width;
    right = context.runnerRect.left + nearestSlice.right * context.runnerRect.width;
  }

  if (!Number.isFinite(left) || !Number.isFinite(right) || right <= left) {
    return null;
  }

  return { left, right };
}

function carveTextSlots(base: TextInterval, blocked: TextInterval | null, minWidth: number): TextInterval[] {
  if (!blocked || blocked.right <= base.left || blocked.left >= base.right) {
    return [base];
  }

  const slots: TextInterval[] = [];

  if (blocked.left > base.left) {
    slots.push({ left: base.left, right: Math.min(blocked.left, base.right) });
  }

  if (blocked.right < base.right) {
    slots.push({ left: Math.max(blocked.right, base.left), right: base.right });
  }

  return slots.filter((slot) => slot.right - slot.left >= minWidth);
}

function layoutLines(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  layoutBoxElement: HTMLElement,
  spriteContext: SpriteLayoutContext | null,
  textFont: string,
): RenderLine[] {
  const lines: RenderLine[] = [];
  let cursor = { segmentIndex: 0, graphemeIndex: 0 };
  let lineIndex = 0;
  const lineHeight = getLineHeight(layoutBoxElement);
  const boxRect = layoutBoxElement.getBoundingClientRect();
  const baseSlot = { left: boxRect.left, right: boxRect.left + maxWidth };
  const minSlotWidth = Math.min(96, Math.max(36, maxWidth * 0.24));
  const maxRows = 160;

  while (true) {
    if (lineIndex > maxRows) {
      break;
    }

    const bandTop = boxRect.top + lineIndex * lineHeight;
    const bandBottom = bandTop + lineHeight;
    const blockedInterval = spriteContext ? getBlockedIntervalForBand(spriteContext, bandTop, bandBottom) : null;
    const slots = carveTextSlots(baseSlot, blockedInterval, minSlotWidth);

    if (slots.length === 0) {
      lines.push({
        fragments: [],
        usesExclusion: true,
      });
      lineIndex += 1;
      continue;
    }

    const fragments: RenderFragment[] = [];

    for (const slot of slots) {
      const slotWidth = Math.max(slot.right - slot.left, 1);
      const line = layoutNextLine(prepared, cursor, slotWidth);

      if (line === null) {
        break;
      }

      const text = line.text.trimEnd();
      const width = text === line.text ? line.width : measureTextWidth(text, textFont, line.width);
      fragments.push({
        justifyWordSpacing: null,
        offset: Math.max(0, slot.left - boxRect.left),
        renderWidth: width,
        slotWidth,
        text,
        width,
      });
      cursor = line.end;
    }

    if (fragments.length === 0) {
      break;
    }

    lines.push({
      fragments: blockedInterval ? justifySplitFragments(fragments) : fragments,
      usesExclusion: blockedInterval !== null,
    });
    lineIndex += 1;
  }

  return lines;
}

function justifySplitFragments(fragments: RenderFragment[]): RenderFragment[] {
  if (fragments.length < 2) {
    return fragments;
  }

  return fragments.map((fragment, index) => {
    if (index === fragments.length - 1) {
      return fragment;
    }

    const extraSpace = fragment.slotWidth - fragment.width;
    const gapCount = countExpandableWordGaps(fragment.text);
    const wordSpacing = gapCount > 0 ? extraSpace / gapCount : 0;

    if (extraSpace < 18 || gapCount < 2 || wordSpacing > 28) {
      return fragment;
    }

    return {
      ...fragment,
      justifyWordSpacing: wordSpacing,
      renderWidth: fragment.slotWidth,
    };
  });
}

function countExpandableWordGaps(text: string): number {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return 0;
  }

  return trimmedText.split(/\s+/).length - 1;
}

function renderPreparedLines(
  element: HTMLElement,
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  lineClassName: string,
  layoutBoxElement: HTMLElement,
  spriteContext: SpriteLayoutContext | null,
): number {
  const lines = layoutLines(
    prepared,
    maxWidth,
    layoutBoxElement,
    spriteContext,
    getTextFont(window.getComputedStyle(element)),
  );
  const fragment = document.createDocumentFragment();
  let exclusionLineCount = 0;
  let splitLineCount = 0;
  const lineHeight = getLineHeight(layoutBoxElement);

  for (const [index, line] of lines.entries()) {
    const lineElement = document.createElement("span");
    lineElement.className =
      line.fragments.length === 0
        ? `blog-scene-line ${lineClassName} blog-scene-line--spacer`
        : `blog-scene-line ${lineClassName}`;
    lineElement.dataset.blogSceneLineIndex = String(index);
    lineElement.dataset.blogSceneRowFragments = String(line.fragments.length);
    lineElement.style.setProperty("--blog-scene-line-height", `${lineHeight}px`);

    if (line.usesExclusion) {
      lineElement.dataset.blogSceneLineFlow = "sprite";
      exclusionLineCount += 1;
    }

    if (line.fragments.length > 1) {
      lineElement.dataset.blogSceneLineSplit = "true";
      splitLineCount += 1;
    }

    if (line.fragments.length === 0) {
      lineElement.textContent = "\u00a0";
    }

    for (const [fragmentIndex, lineFragment] of line.fragments.entries()) {
      const fragmentElement = document.createElement("span");
      fragmentElement.className = "blog-scene-line-fragment";
      fragmentElement.textContent = lineFragment.text;
      fragmentElement.dataset.blogSceneLineFragmentIndex = String(fragmentIndex);
      if (lineFragment.justifyWordSpacing !== null) {
        fragmentElement.dataset.blogSceneLineFragmentJustify = "true";
        fragmentElement.style.setProperty("--blog-scene-fragment-word-spacing", `${lineFragment.justifyWordSpacing}px`);
      }
      fragmentElement.style.setProperty("--blog-scene-fragment-offset", `${lineFragment.offset}px`);
      fragmentElement.style.setProperty("--blog-scene-fragment-width", `${lineFragment.renderWidth}px`);
      lineElement.append(fragmentElement);
    }

    fragment.append(lineElement);
  }

  element.replaceChildren(fragment);
  element.dataset.blogSceneEnhanced = "true";
  element.dataset.blogSceneSplitLines = String(splitLineCount);
  return exclusionLineCount;
}

function renderScene(state: BlogSceneState): void {
  const spriteContext = getSpriteLayoutContext(state);
  let activeCardCount = 0;
  let activeLineCount = 0;
  let splitLineCount = 0;

  for (const postState of state.postStates) {
    const shouldUseSpriteContext =
      spriteContext !== null && rectsOverlap(postState.cardElement.getBoundingClientRect(), spriteContext.boundsRect, 80);
    const lineSpriteContext = shouldUseSpriteContext ? spriteContext : null;
    const titleExclusionCount = renderPreparedLines(
      postState.titleElement,
      postState.preparedTitle,
      getRenderWidth(postState.titleBlockElement),
      "blog-scene-line--title",
      postState.titleBlockElement,
      lineSpriteContext,
    );
    const descriptionExclusionCount = renderPreparedLines(
      postState.descriptionElement,
      postState.preparedDescription,
      getRenderWidth(postState.descriptionElement),
      "blog-scene-line--description",
      postState.descriptionElement,
      lineSpriteContext,
    );
    const cardLineCount = titleExclusionCount + descriptionExclusionCount;
    const cardSplitLineCount =
      Number(postState.titleElement.dataset.blogSceneSplitLines ?? 0) +
      Number(postState.descriptionElement.dataset.blogSceneSplitLines ?? 0);

    if (cardLineCount > 0) {
      activeCardCount += 1;
      activeLineCount += cardLineCount;
      splitLineCount += cardSplitLineCount;
      postState.cardElement.dataset.blogSceneCardFlowState = "sprite";
      postState.cardElement.dataset.blogSceneCardSplitLines = String(cardSplitLineCount);
    } else {
      postState.cardElement.dataset.blogSceneCardFlowState = "resting";
      postState.cardElement.dataset.blogSceneCardSplitLines = "0";
    }

    postState.cardElement.dataset.blogSceneCardState = "laid-out";
  }

  state.root.dataset.blogSceneState = "laid-out";
  state.root.dataset.blogSceneReflowState = activeCardCount > 0 ? "active" : "resting";
  state.root.dataset.blogSceneReflowCards = String(activeCardCount);
  state.root.dataset.blogSceneReflowLines = String(activeLineCount);
  state.root.dataset.blogSceneReflowSplitLines = String(splitLineCount);
}

async function initializeSpriteShape(state: BlogSceneState): Promise<void> {
  const request = getSpriteShapeRequest();

  if (!request) {
    state.root.dataset.blogSceneSpriteShape = "unavailable";
    return;
  }

  state.root.dataset.blogSceneSpriteShape = "pending";
  request.runnerElement.dataset.spriteShapeState = "pending";

  try {
    const hull = await buildSpriteAlphaHull(request.src, request.options);
    const spriteShape = {
      frameIndex: request.frameIndex,
      hull,
      runnerElement: request.runnerElement,
      src: request.src,
    } satisfies BlogSceneSpriteShapeState;

    state.spriteShape = spriteShape;
    state.root.dataset.blogSceneSpriteShape = "ready";
    state.root.dataset.blogSceneSpriteShapeFrame = String(request.frameIndex);
    state.root.dataset.blogSceneSpriteShapeSlices = String(hull.slices.length);
    state.root.dataset.blogSceneSpriteShapeSliceWidths = getSliceWidthSummary(hull);
    state.root.dataset.blogSceneSpriteShapeBounds = [
      hull.bounds.x,
      hull.bounds.y,
      hull.bounds.width,
      hull.bounds.height,
    ]
      .map((value) => value.toFixed(3))
      .join(",");
    request.runnerElement.dataset.spriteShapeState = "ready";
    request.runnerElement.dataset.spriteShapeFrame = String(request.frameIndex);
    request.runnerElement.dataset.spriteShapeSlices = String(hull.slices.length);
    request.runnerElement.dataset.spriteShapeSliceWidths = getSliceWidthSummary(hull);
    state.root.dispatchEvent(new CustomEvent("blog-scene:sprite-shape-ready", { detail: spriteShape }));
    bindSpriteMotionRendering(request.runnerElement);
    renderScene(state);
  } catch (error) {
    state.root.dataset.blogSceneSpriteShape = "error";
    request.runnerElement.dataset.spriteShapeState = "error";
    console.warn("Could not build sprite alpha hull for blog scene.", error);
  }
}

function getSliceWidthSummary(hull: SpriteAlphaHull): string {
  const widths = hull.slices.map((slice) => slice.right - slice.left);

  if (widths.length === 0) {
    return "0.000,0.000";
  }

  return [Math.min(...widths), Math.max(...widths)].map((value) => value.toFixed(3)).join(",");
}

function createSceneState(root: HTMLElement, groups: BlogSceneYearGroup[]): BlogSceneState | null {
  const scenePosts = groups.flatMap((group) => group.posts);
  const cardElements = Array.from(root.querySelectorAll(".post-card")).filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  );

  if (scenePosts.length !== cardElements.length) {
    return null;
  }

  const postStates: BlogScenePostState[] = [];

  for (const [index, cardElement] of cardElements.entries()) {
    const post = scenePosts[index];
    const titleElement = cardElement.querySelector(".post-card__link");
    const titleBlockElement = titleElement?.closest("h2, h3");
    const descriptionElement = getDescriptionElement(cardElement);

    if (
      !(titleElement instanceof HTMLAnchorElement) ||
      !(titleBlockElement instanceof HTMLElement) ||
      !(descriptionElement instanceof HTMLParagraphElement)
    ) {
      return null;
    }

    const titleStyle = window.getComputedStyle(titleElement);
    const descriptionStyle = window.getComputedStyle(descriptionElement);

    postStates.push({
      post,
      cardElement,
      titleElement,
      titleBlockElement,
      descriptionElement,
      preparedTitle: prepareWithSegments(post.title, getTextFont(titleStyle)),
      preparedDescription: prepareWithSegments(post.description, getTextFont(descriptionStyle)),
    });
  }

  return {
    root,
    groups,
    postStates,
    yearHeadingElements: Array.from(root.querySelectorAll(".blog-year-group__title")).filter(
      (element): element is HTMLHeadingElement => element instanceof HTMLHeadingElement,
    ),
  };
}

function renderAllScenes(): void {
  for (const root of sceneRoots) {
    if (!root.isConnected) {
      sceneRoots.delete(root);
      continue;
    }

    const state = sceneStates.get(root);

    if (!state) {
      continue;
    }

    renderScene(state);
  }
}

function scheduleSpriteMotionRendering(): void {
  if (spriteMotionFrameId !== null) {
    return;
  }

  const tick = () => {
    renderAllScenes();

    const hasMovingSprite = Array.from(document.querySelectorAll("[data-sprite-runner]")).some(
      (element) => element instanceof HTMLElement && element.dataset.motionState === "moving",
    );

    if (hasMovingSprite) {
      spriteMotionFrameId = window.requestAnimationFrame(tick);
      return;
    }

    spriteMotionFrameId = null;
    renderAllScenes();
  };

  spriteMotionFrameId = window.requestAnimationFrame(tick);
}

function bindSpriteMotionRendering(runnerElement: HTMLElement): void {
  if (runnerElement.dataset.blogSceneMotionBound === "true") {
    return;
  }

  runnerElement.dataset.blogSceneMotionBound = "true";
  runnerElement.addEventListener("transitionrun", (event) => {
    if (event.propertyName === "transform") {
      scheduleSpriteMotionRendering();
    }
  });
  runnerElement.addEventListener("transitionstart", (event) => {
    if (event.propertyName === "transform") {
      scheduleSpriteMotionRendering();
    }
  });
  runnerElement.addEventListener("transitionend", (event) => {
    if (event.propertyName === "transform") {
      scheduleSpriteMotionRendering();
    }
  });

  const observer = new MutationObserver(() => {
    if (runnerElement.dataset.motionState === "moving") {
      scheduleSpriteMotionRendering();
    } else {
      renderAllScenes();
    }
  });

  observer.observe(runnerElement, { attributeFilter: ["data-motion-state"] });
}

function bindResizeHandler(): void {
  if (didBindResize) {
    return;
  }

  didBindResize = true;
  window.addEventListener("resize", () => {
    if (resizeFrameId !== null) {
      window.cancelAnimationFrame(resizeFrameId);
    }

    resizeFrameId = window.requestAnimationFrame(() => {
      resizeFrameId = null;
      renderAllScenes();
    });
  });
}

async function initializeSceneRoot(sceneRoot: HTMLElement): Promise<void> {
  const groups = parseSceneGroups(sceneRoot);

  if (!groups) {
    delete sceneRoot.dataset.blogSceneReady;
    return;
  }

  await document.fonts.ready;

  const state = createSceneState(sceneRoot, groups);

  if (!state) {
    delete sceneRoot.dataset.blogSceneReady;
    return;
  }

  sceneStates.set(sceneRoot, state);
  sceneRoots.add(sceneRoot);
  renderScene(state);
  void initializeSpriteShape(state);
  sceneRoot.dataset.blogSceneReady = "true";
}

export function initBlogScenes(): void {
  const sceneRoots = document.querySelectorAll("[data-blog-scene-root]");

  if (sceneRoots.length === 0) {
    return;
  }

  syncLocale();
  bindResizeHandler();

  for (const sceneRoot of sceneRoots) {
    if (
      !(sceneRoot instanceof HTMLElement) ||
      sceneRoot.dataset.blogSceneReady === "true" ||
      sceneRoot.dataset.blogSceneReady === "pending"
    ) {
      continue;
    }

    sceneRoot.dataset.blogSceneReady = "pending";
    void initializeSceneRoot(sceneRoot);
  }
}
