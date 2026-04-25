export interface SpriteFrameConfig {
  holdMs: number;
  path: string;
}

export interface SpriteLoopConfig {
  frameIndexes: number[];
  holdMs: number[];
}

export interface SpritePlaybackPhaseConfig {
  frameIndexes: number[];
  holdMs: number[];
  repeat: number | "infinite";
}

export interface SpriteMotionConfig {
  horizontalDriftRatio: number;
  rotationMaxDegPerSecond: number;
  speedPxPerSecond: number;
  targetOffsetPx: number;
  targetSelector: string;
  topSafetyPx: number;
  viewportFallbackRatio: number;
  waypointCount: number;
}

export interface SpriteShapeConfig {
  alphaThreshold: number;
  frameIndex: number;
  horizontalPaddingRatio: number;
  maxDimension: number;
  sampleCount: number;
  smoothRadius: number;
  verticalPaddingRatio: number;
}

export interface SpriteAnimationConfig {
  frames: SpriteFrameConfig[];
  game: SpriteGameConfig;
  imageSize: number;
  motion: SpriteMotionConfig;
  scale: number;
  shape: SpriteShapeConfig;
  phases: SpritePlaybackPhaseConfig[];
  version: string;
  walkFrames: SpriteFrameConfig[];
}

export interface SpriteGameConfig {
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
}

export const blogSpriteConfig: SpriteAnimationConfig = {
  version: "pirate-walk-2",
  imageSize: 256,
  // Multiply the on-page sprite footprint by this value. `0.5` means 50% of the default size.
  scale: 0.7,
  game: {
    bodyWidthRatio: 0.38,
    footHeightRatio: 0.82,
    gravityPxPerSecondSquared: 2200,
    horizontalForgivenessPx: 10,
    jumpVelocityPxPerSecond: 760,
    maxFallPxPerSecond: 1500,
    moveAccelerationPxPerSecondSquared: 2800,
    moveFrictionPxPerSecondSquared: 3200,
    moveSpeedPxPerSecond: 360,
    platformVerticalForgivenessPx: 9,
    spawnViewportXRatio: 0.68,
  },
  motion: {
    horizontalDriftRatio: 0.42,
    rotationMaxDegPerSecond: 140,
    speedPxPerSecond: 110,
    targetOffsetPx: 24,
    targetSelector: ".blog-year-groups",
    topSafetyPx: 88,
    viewportFallbackRatio: 0.18,
    waypointCount: 6,
  },
  shape: {
    alphaThreshold: 12,
    frameIndex: 0,
    horizontalPaddingRatio: 0.06,
    maxDimension: 320,
    sampleCount: 56,
    smoothRadius: 5,
    verticalPaddingRatio: 0.03,
  },
  // Edit `holdMs` to control how long each frame stays visible in the first full run.
  frames: [
    { path: "/images/pirate-bounce-candidates/variant-3/frames/frame-01.png", holdMs: 560 },
    { path: "/images/pirate-bounce-candidates/variant-3/frames/frame-02.png", holdMs: 240 },
    { path: "/images/pirate-bounce-candidates/variant-3/frames/frame-03.png", holdMs: 320 },
    { path: "/images/pirate-bounce-candidates/variant-3/frames/frame-04.png", holdMs: 420 },
  ],
  walkFrames: [
    { path: "/images/pirate-bounce-candidates/variant-3/walk/frames/frame-01.png", holdMs: 92 },
    { path: "/images/pirate-bounce-candidates/variant-3/walk/frames/frame-02.png", holdMs: 92 },
    { path: "/images/pirate-bounce-candidates/variant-3/walk/frames/frame-03.png", holdMs: 92 },
    { path: "/images/pirate-bounce-candidates/variant-3/walk/frames/frame-04.png", holdMs: 92 },
    { path: "/images/pirate-bounce-candidates/variant-3/walk/frames/frame-05.png", holdMs: 92 },
    { path: "/images/pirate-bounce-candidates/variant-3/walk/frames/frame-06.png", holdMs: 92 },
  ],
  // Phases are zero-based frame indexes. The runner plays them in order.
  phases: [
    { frameIndexes: [0, 1, 2, 3, 1], holdMs: [560, 240, 320, 420, 260], repeat: "infinite" },
  ],
};
