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
  fallFrames: SpriteFrameConfig[];
  frames: SpriteFrameConfig[];
  game: SpriteGameConfig;
  imageSize: number;
  jumpFrames: SpriteFrameConfig[];
  landFrames: SpriteFrameConfig[];
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
  version: "mahesh-sprite-face-ref-v4-idle-order-speed08-1",
  imageSize: 256,
  // Multiply the on-page sprite footprint by this value. `0.5` means 50% of the default size.
  scale: 0.72,
  game: {
    bodyWidthRatio: 0.34,
    footHeightRatio: 0.86,
    gravityPxPerSecondSquared: 2200,
    horizontalForgivenessPx: 10,
    jumpVelocityPxPerSecond: 760,
    maxFallPxPerSecond: 1500,
    moveAccelerationPxPerSecondSquared: 2240,
    moveFrictionPxPerSecondSquared: 2560,
    moveSpeedPxPerSecond: 288,
    platformVerticalForgivenessPx: 9,
    spawnViewportXRatio: 0.68,
  },
  motion: {
    horizontalDriftRatio: 0.42,
    rotationMaxDegPerSecond: 112,
    speedPxPerSecond: 88,
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
  // Idle reads better as a small personality beat: neutral, chill, excited, thumbs-up, hello.
  frames: [
    { path: "/images/mahesh-sprite/frames/frame-06.png", holdMs: 1225 },
    { path: "/images/mahesh-sprite/frames/frame-04.png", holdMs: 1100 },
    { path: "/images/mahesh-sprite/frames/frame-03.png", holdMs: 800 },
    { path: "/images/mahesh-sprite/frames/frame-02.png", holdMs: 950 },
    { path: "/images/mahesh-sprite/frames/frame-01.png", holdMs: 900 },
  ],
  walkFrames: [
    { path: "/images/mahesh-sprite/run/frame-01.png", holdMs: 95 },
    { path: "/images/mahesh-sprite/run/frame-02.png", holdMs: 95 },
    { path: "/images/mahesh-sprite/run/frame-03.png", holdMs: 95 },
    { path: "/images/mahesh-sprite/run/frame-04.png", holdMs: 95 },
    { path: "/images/mahesh-sprite/run/frame-05.png", holdMs: 95 },
    { path: "/images/mahesh-sprite/run/frame-06.png", holdMs: 95 },
  ],
  jumpFrames: [
    { path: "/images/mahesh-sprite/jump/frame-01.png", holdMs: 80 },
    { path: "/images/mahesh-sprite/jump/frame-02.png", holdMs: 90 },
    { path: "/images/mahesh-sprite/jump/frame-03.png", holdMs: 110 },
    { path: "/images/mahesh-sprite/jump/frame-04.png", holdMs: 110 },
  ],
  fallFrames: [
    { path: "/images/mahesh-sprite/fall/frame-01.png", holdMs: 120 },
    { path: "/images/mahesh-sprite/fall/frame-02.png", holdMs: 120 },
  ],
  landFrames: [
    { path: "/images/mahesh-sprite/land/frame-01.png", holdMs: 90 },
    { path: "/images/mahesh-sprite/land/frame-02.png", holdMs: 110 },
  ],
  // Phases are zero-based frame indexes. The runner plays them in order.
  phases: [
    { frameIndexes: [0, 1, 2, 3, 4], holdMs: [1225, 1100, 800, 950, 900], repeat: "infinite" },
  ],
};
