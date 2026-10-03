package org.finos.vuu.core.module.price

/**
 * Port of the mulberry32 PRNG (pseudo-random number generator - a repeatable
 * sequence of "random-looking" numbers derived from a starting seed, rather
 * than true randomness) used by the JS side of the vuu-ui perf benchmark
 * (sample-apps/perf-benchmark/src/harness). Verified bit-identical against
 * the JS implementation for a range of seeds - this is the only randomness
 * source used for benchmark data/tick generation so that VUU and ag-grid can
 * be driven by the exact same sequence of "random" decisions.
 *
 * Do not change this algorithm without re-verifying parity with the JS port.
 */
class BenchmarkPrng(seed: Int) {
  private var state: Int = seed

  /** Rewinds back to the constructor seed, so a stream can be replayed identically. */
  def reset(): Unit = {
    state = seed
  }

  def nextDouble(): Double = {
    state = state + 0x6d2b79f5
    val s = state
    val t1 = (s ^ (s >>> 15)) * (1 | s)
    val c = (t1 ^ (t1 >>> 7)) * (61 | t1)
    val t2 = (t1 + c) ^ t1
    val bits = t2 ^ (t2 >>> 14)
    (bits.toLong & 0xFFFFFFFFL).toDouble / 4294967296.0
  }

  /** integer in [0, bound) */
  def nextInt(bound: Int): Int = (nextDouble() * bound).toInt
}
