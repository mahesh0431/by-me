export interface SpriteAlphaHullPoint {
  x: number;
  y: number;
}

export interface SpriteAlphaHullSlice {
  left: number;
  right: number;
  y: number;
}

export interface SpriteAlphaHullBounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface SpriteAlphaHullOptions {
  alphaThreshold?: number;
  horizontalPaddingRatio?: number;
  maxDimension?: number;
  sampleCount?: number;
  smoothRadius?: number;
  verticalPaddingRatio?: number;
}

export interface SpriteAlphaHull {
  alphaThreshold: number;
  analysisHeight: number;
  analysisWidth: number;
  bounds: SpriteAlphaHullBounds;
  horizontalPaddingRatio: number;
  points: SpriteAlphaHullPoint[];
  slices: SpriteAlphaHullSlice[];
  sourceHeight: number;
  sourceWidth: number;
  src: string;
  verticalPaddingRatio: number;
}

interface AlphaEdges {
  lefts: Array<number | null>;
  rights: Array<number | null>;
  validRows: number[];
}

interface NormalizedOptions {
  alphaThreshold: number;
  horizontalPaddingRatio: number;
  maxDimension: number;
  sampleCount: number;
  smoothRadius: number;
  verticalPaddingRatio: number;
}

const hullCache = new Map<string, Promise<SpriteAlphaHull>>();

export function buildSpriteAlphaHull(src: string, options: SpriteAlphaHullOptions = {}): Promise<SpriteAlphaHull> {
  const normalizedOptions = normalizeOptions(options);
  const cacheKey = `${src}::${JSON.stringify(normalizedOptions)}`;
  const cached = hullCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const hullPromise = createSpriteAlphaHull(src, normalizedOptions);
  hullCache.set(cacheKey, hullPromise);
  return hullPromise;
}

function normalizeOptions(options: SpriteAlphaHullOptions): NormalizedOptions {
  return {
    alphaThreshold: normalizeNumber(options.alphaThreshold, 12, 0, 255),
    horizontalPaddingRatio: normalizeNumber(options.horizontalPaddingRatio, 0.06, 0, 0.5),
    maxDimension: Math.round(normalizeNumber(options.maxDimension, 320, 32, 1024)),
    sampleCount: Math.round(normalizeNumber(options.sampleCount, 56, 8, 160)),
    smoothRadius: Math.round(normalizeNumber(options.smoothRadius, 5, 0, 48)),
    verticalPaddingRatio: normalizeNumber(options.verticalPaddingRatio, 0.03, 0, 0.5),
  };
}

function normalizeNumber(value: number | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

async function createSpriteAlphaHull(src: string, options: NormalizedOptions): Promise<SpriteAlphaHull> {
  const image = await loadImage(src);
  const { width, height } = getAnalysisSize(image, options.maxDimension);
  const context = createCanvasContext(width, height);

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const edges = readAlphaEdges(imageData.data, width, height, options.alphaThreshold);

  if (edges.validRows.length === 0) {
    throw new Error(`No visible sprite pixels found in ${src}`);
  }

  const smoothed = smoothEdges(edges, height, options.smoothRadius);
  const slices = buildSlices(smoothed, edges.validRows, width, height, options);
  const bounds = getBoundsFromSlices(slices);
  const points = buildHullPoints(slices);

  return {
    alphaThreshold: options.alphaThreshold,
    analysisHeight: height,
    analysisWidth: width,
    bounds,
    horizontalPaddingRatio: options.horizontalPaddingRatio,
    points,
    slices,
    sourceHeight: image.naturalHeight,
    sourceWidth: image.naturalWidth,
    src,
    verticalPaddingRatio: options.verticalPaddingRatio,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load sprite frame ${src}`));
    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      resolve(image);
    }
  });
}

function getAnalysisSize(image: HTMLImageElement, maxDimension: number): { height: number; width: number } {
  const aspectRatio = image.naturalWidth / image.naturalHeight;

  if (aspectRatio >= 1) {
    return {
      height: Math.max(1, Math.round(maxDimension / aspectRatio)),
      width: maxDimension,
    };
  }

  return {
    height: maxDimension,
    width: Math.max(1, Math.round(maxDimension * aspectRatio)),
  };
}

function createCanvasContext(width: number, height: number): OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D {
  if (typeof OffscreenCanvas === "function") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");

    if (context) {
      return context;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create a 2D canvas context for sprite shape detection");
  }

  return context;
}

function readAlphaEdges(data: Uint8ClampedArray, width: number, height: number, alphaThreshold: number): AlphaEdges {
  const lefts: Array<number | null> = new Array(height).fill(null);
  const rights: Array<number | null> = new Array(height).fill(null);
  const validRows: number[] = [];

  for (let y = 0; y < height; y += 1) {
    let left = -1;
    let right = -1;

    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha === undefined || alpha <= alphaThreshold) {
        continue;
      }

      if (left === -1) {
        left = x;
      }

      right = x + 1;
    }

    if (left !== -1 && right !== -1) {
      lefts[y] = left;
      rights[y] = right;
      validRows.push(y);
    }
  }

  return { lefts, rights, validRows };
}

function smoothEdges(edges: AlphaEdges, height: number, smoothRadius: number): AlphaEdges {
  if (smoothRadius === 0) {
    return edges;
  }

  const lefts: Array<number | null> = new Array(height).fill(null);
  const rights: Array<number | null> = new Array(height).fill(null);

  for (const row of edges.validRows) {
    let count = 0;
    let leftTotal = 0;
    let rightTotal = 0;

    for (let offset = -smoothRadius; offset <= smoothRadius; offset += 1) {
      const sampleRow = row + offset;

      if (sampleRow < 0 || sampleRow >= height) {
        continue;
      }

      const left = edges.lefts[sampleRow];
      const right = edges.rights[sampleRow];

      if (left === null || right === null) {
        continue;
      }

      leftTotal += left;
      rightTotal += right;
      count += 1;
    }

    if (count > 0) {
      lefts[row] = leftTotal / count;
      rights[row] = rightTotal / count;
    }
  }

  return {
    lefts,
    rights,
    validRows: edges.validRows,
  };
}

function buildSlices(
  edges: AlphaEdges,
  validRows: number[],
  width: number,
  height: number,
  options: NormalizedOptions,
): SpriteAlphaHullSlice[] {
  const paddingX = width * options.horizontalPaddingRatio;
  const paddingY = height * options.verticalPaddingRatio;
  const firstRow = validRows[0] ?? 0;
  const lastRow = validRows[validRows.length - 1] ?? firstRow;
  const topRow = Math.max(0, Math.floor(firstRow - paddingY));
  const bottomRow = Math.min(height - 1, Math.ceil(lastRow + paddingY));
  const sampledRows = sampleRows(validRows, options.sampleCount);
  const hullRows = Array.from(new Set([topRow, ...sampledRows, bottomRow])).sort((left, right) => left - right);

  return hullRows.map((row) => {
    const edgeRow = clamp(row, firstRow, lastRow);
    const nearestRow = findNearestValidRow(edgeRow, validRows);
    const left = edges.lefts[nearestRow] ?? 0;
    const right = edges.rights[nearestRow] ?? width;

    return {
      left: clamp((left - paddingX) / width, 0, 1),
      right: clamp((right + paddingX) / width, 0, 1),
      y: clamp((row + 0.5) / height, 0, 1),
    };
  });
}

function sampleRows(validRows: number[], sampleCount: number): number[] {
  if (validRows.length <= sampleCount) {
    return validRows;
  }

  const rows: number[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const sourceIndex = Math.round((index * (validRows.length - 1)) / Math.max(sampleCount - 1, 1));
    rows.push(validRows[sourceIndex] ?? validRows[0] ?? 0);
  }

  return rows;
}

function findNearestValidRow(row: number, validRows: number[]): number {
  let low = 0;
  let high = validRows.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const current = validRows[middle] ?? row;

    if (current === row) {
      return current;
    }

    if (current < row) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  const before = validRows[Math.max(0, high)];
  const after = validRows[Math.min(validRows.length - 1, low)];

  if (before === undefined) {
    return after ?? row;
  }

  if (after === undefined) {
    return before;
  }

  return Math.abs(before - row) <= Math.abs(after - row) ? before : after;
}

function getBoundsFromSlices(slices: SpriteAlphaHullSlice[]): SpriteAlphaHullBounds {
  const left = Math.min(...slices.map((slice) => slice.left));
  const right = Math.max(...slices.map((slice) => slice.right));
  const top = Math.min(...slices.map((slice) => slice.y));
  const bottom = Math.max(...slices.map((slice) => slice.y));

  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  };
}

function buildHullPoints(slices: SpriteAlphaHullSlice[]): SpriteAlphaHullPoint[] {
  const leftEdge = slices.map((slice) => ({ x: slice.left, y: slice.y }));
  const rightEdge = [...slices].reverse().map((slice) => ({ x: slice.right, y: slice.y }));

  return leftEdge.concat(rightEdge);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
