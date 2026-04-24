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
  imageSize: number;
  motion: SpriteMotionConfig;
  scale: number;
  shape: SpriteShapeConfig;
  phases: SpritePlaybackPhaseConfig[];
  version: string;
}

export const blogSpriteConfig: SpriteAnimationConfig = {
  version: "bounce-8",
  imageSize: 256,
  // Multiply the on-page sprite footprint by this value. `0.5` means 50% of the default size.
  scale: 0.5,
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
    frameIndex: 9,
    horizontalPaddingRatio: 0.06,
    maxDimension: 320,
    sampleCount: 56,
    smoothRadius: 5,
    verticalPaddingRatio: 0.03,
  },
  // Edit `holdMs` to control how long each frame stays visible in the first full run.
  frames: [
    { path: "/images/op-bounce/frame-01.png", holdMs: 400 },
    { path: "/images/op-bounce/frame-02.png", holdMs: 400 },
    { path: "/images/op-bounce/frame-03.png", holdMs: 400 },
    { path: "/images/op-bounce/frame-04.png", holdMs: 400 },
    { path: "/images/op-bounce/frame-05.png", holdMs: 600 },
    { path: "/images/op-bounce/frame-06.png", holdMs: 600 },
    { path: "/images/op-bounce/bounce man 6.1.png", holdMs: 200 },
    { path: "/images/op-bounce/frame-07.png", holdMs: 400 },
    { path: "/images/op-bounce/frame-08.png", holdMs: 400 },
    { path: "/images/op-bounce/bounce man 9 new.png", holdMs: 200 },
    { path: "/images/op-bounce/bounce man 10.png", holdMs: 200 },
  ],
  // Phases are zero-based frame indexes. The runner plays them in order.
  phases: [
    { frameIndexes: [0, 1, 2, 3], holdMs: [400, 400, 400, 400], repeat: 1 },
    { frameIndexes: [4, 5, 6], holdMs: [400, 200, 200], repeat: 1 },
    { frameIndexes: [7], holdMs: [400], repeat: 1 },
    { frameIndexes: [9, 10], holdMs: [200, 200], repeat: "infinite" },
  ],
};
