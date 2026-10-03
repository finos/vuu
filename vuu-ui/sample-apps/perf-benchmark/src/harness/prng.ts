/**
 * Deterministic PRNG (pseudo-random number generator - produces a repeatable
 * sequence of "random-looking" numbers from a starting seed, rather than
 * true randomness) using the mulberry32 algorithm. Shared by every
 * generator/tick site in this benchmark - JS row generation, JS tick
 * mutation, and the Node feed server used for ag-grid - as well as ported
 * bit-for-bit to Scala for the real VUU server
 * (example/price/.../BenchmarkPrng.scala). Same seed must produce the same
 * sequence everywhere; do not change this algorithm without re-verifying
 * parity across all ports.
 */
export function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
