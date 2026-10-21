import type { Distribution, FrameStats } from "./types";

export const FRAME_BUDGET_MS = 1000 / 60;
const JANK_THRESHOLD_MS = FRAME_BUDGET_MS * 1.5;

/** Nearest-rank percentile of an ascending sorted array */
export const percentile = (sorted: ArrayLike<number>, p: number) => {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank))];
};

export const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const round = (n: number, places = 2) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};

export const distribution = (values: ArrayLike<number>): Distribution => {
  const sorted = Float64Array.from(values).sort();
  let sum = 0;
  for (let i = 0; i < sorted.length; i++) sum += sorted[i];
  return {
    count: sorted.length,
    mean: sorted.length ? round(sum / sorted.length) : 0,
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    max: round(sorted.length ? sorted[sorted.length - 1] : 0),
  };
};

export const frameStats = (frameTimes: ArrayLike<number>): FrameStats => {
  let jankyFrames = 0;
  for (let i = 0; i < frameTimes.length; i++) {
    if (frameTimes[i] > JANK_THRESHOLD_MS) jankyFrames += 1;
  }
  return {
    ...distribution(frameTimes),
    jankyFrames,
    jankyPct: frameTimes.length
      ? round((100 * jankyFrames) / frameTimes.length)
      : 0,
  };
};

/**
 * Two-sided Mann-Whitney U test, normal approximation with tie correction.
 * Returns the p-value for the hypothesis that a and b come from the same
 * distribution. Adequate for the 5-20 samples per side we collect.
 */
export const mannWhitneyU = (a: number[], b: number[]) => {
  const n1 = a.length;
  const n2 = b.length;
  if (n1 === 0 || n2 === 0) return 1;
  const all = [
    ...a.map((value) => ({ value, group: 0 })),
    ...b.map((value) => ({ value, group: 1 })),
  ].sort((x, y) => x.value - y.value);

  const ranks = new Array<number>(all.length);
  let tieTerm = 0;
  for (let i = 0; i < all.length; ) {
    let j = i;
    while (j + 1 < all.length && all[j + 1].value === all[i].value) j++;
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = rank;
    const t = j - i + 1;
    tieTerm += t * t * t - t;
    i = j + 1;
  }

  let rankSumA = 0;
  all.forEach((item, i) => {
    if (item.group === 0) rankSumA += ranks[i];
  });
  const u1 = rankSumA - (n1 * (n1 + 1)) / 2;
  const n = n1 + n2;
  const mean = (n1 * n2) / 2;
  const variance = ((n1 * n2) / 12) * (n + 1 - tieTerm / (n * (n - 1)));
  if (variance <= 0) return 1;
  const z = (Math.abs(u1 - mean) - 0.5) / Math.sqrt(variance);
  return Math.min(1, 2 * (1 - normalCdf(Math.max(0, z))));
};

// Abramowitz & Stegun 7.1.26
const normalCdf = (z: number) => {
  const t = 1 / (1 + 0.3275911 * (z / Math.SQRT2));
  const erf =
    1 -
    t *
      (0.254829592 +
        t *
          (-0.284496736 +
            t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
      Math.exp(-(z * z) / 2);
  return 0.5 * (1 + erf);
};
