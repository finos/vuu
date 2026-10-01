package org.finos.vuu.core.module.price

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.{LifeCycleRunner, RunInThread}
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

case class BenchmarkBurstResult(totalUpdates: Int, durationMs: Long, updatesPerSecond: Double)

case class BenchmarkStreamStats(messagesSent: Long, rowsUpdated: Long, totalDriftMs: Double, maxDriftMs: Double)

/**
 * Controlled-rate, full-dataset tick provider for the vuu-ui perf benchmark.
 *
 * Unlike SimulatedPricesProvider (which only ticks subscribed/visible rows -
 * the real production behaviour), this provider ticks across the entire
 * dataset regardless of visibility, at a precisely controlled rate. That's a
 * deliberate deviation from production semantics: it's what makes the
 * numbers comparable to ag-grid's own published benchmark methodology
 * (fixed messages/sec of fixed row-updates each, applied to the full
 * in-memory dataset).
 */
class BenchmarkTickProvider(val table: DataTable, val rowCount: Int, seed: Int = 42)
                            (implicit val timeProvider: Clock, lifecycle: LifecycleContainer)
  extends Provider with StrictLogging with RunInThread {

  private var rows: Array[BenchmarkInstrument] = BenchmarkInstruments.generate(rowCount, seed)

  // Separate PRNG (pseudo-random number generator) stream for tick decisions,
  // seeded independently of the row generator - mirrors the JS harness,
  // where TickEngine uses its own mulberry32(1) distinct from
  // generateInstruments' seed.
  private val tickRnd = new BenchmarkPrng(1)

  @volatile private var ticking = false
  @volatile private var updatesPerSecond = 0
  @volatile private var updatesPerMessage = 100

  // Authoritative server-side counters for the streaming (non-burst) path,
  // exposed via RPC. totalDriftMs/maxDriftMs mirror TickEngine.ts's own
  // per-message scheduling drift tracking exactly (same self-correcting
  // nextExpectedTime schedule, same "how late did this tick fire vs when
  // it was due" measurement per message) so VUU-backed and feed-server-backed
  // variants report a genuinely comparable statistic rather than one side
  // sampling once per test and the other sampling every message.
  // System.nanoTime() rather than currentTimeMillis(): the latter's
  // resolution can be as coarse as ~15ms on Windows, which would swamp the
  // drift values themselves.
  private val streamMessagesSent = new java.util.concurrent.atomic.AtomicLong(0)
  private val streamRowsUpdated = new java.util.concurrent.atomic.AtomicLong(0)
  @volatile private var streamTotalDriftMs: Double = 0.0
  @volatile private var streamMaxDriftMs: Double = 0.0
  private var nextExpectedTimeNanos: Long = 0L

  private val runner = new LifeCycleRunner(s"benchmarkTickProvider-${table.name}", () => runOnce())
  lifecycle(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {
    logger.info(s"[BenchmarkTickProvider] seeding ${rows.length} rows into ${table.name}")
    var i = 0
    while (i < rows.length) {
      val row = rows(i)
      table.processUpdate(row.ric, RowWithData(row.ric, BenchmarkInstruments.toFieldMap(row)))
      i += 1
    }
  }

  override def doStop(): Unit = {
    ticking = false
  }

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = s"benchmarkTickProvider-${table.name}"

  def startTicking(updatesPerSecondArg: Int, updatesPerMessageArg: Int): Unit = {
    updatesPerSecond = Math.max(1, updatesPerSecondArg)
    updatesPerMessage = Math.max(1, updatesPerMessageArg)
    streamMessagesSent.set(0)
    streamRowsUpdated.set(0)
    streamTotalDriftMs = 0.0
    streamMaxDriftMs = 0.0
    nextExpectedTimeNanos = System.nanoTime() + intervalNanos
    ticking = true
  }

  def stopTicking(): Unit = {
    ticking = false
  }

  /**
   * Regenerates the dataset from the original seed and rewinds the tick PRNG,
   * so every test run (regardless of what any earlier test already did to
   * this table) starts from the exact same data and the exact same sequence
   * of "random" updates - the comparison's core premise (see README's
   * "Shared harness / determinism") otherwise silently breaks the moment a
   * second test touches the same table, since doStart() only seeds once for
   * the lifetime of the server process.
   */
  def resetDataset(): Unit = {
    ticking = false
    tickRnd.reset()
    rows = BenchmarkInstruments.generate(rowCount, seed)
    var i = 0
    while (i < rows.length) {
      val row = rows(i)
      table.processUpdate(row.ric, RowWithData(row.ric, BenchmarkInstruments.toFieldMap(row)))
      i += 1
    }
    resetStreamStats()
  }

  def getStreamStats: BenchmarkStreamStats =
    BenchmarkStreamStats(streamMessagesSent.get(), streamRowsUpdated.get(), streamTotalDriftMs, streamMaxDriftMs)

  def resetStreamStats(): Unit = {
    streamMessagesSent.set(0)
    streamRowsUpdated.set(0)
    streamTotalDriftMs = 0.0
    streamMaxDriftMs = 0.0
  }

  private def intervalNanos: Long =
    (updatesPerMessage.toDouble / updatesPerSecond.toDouble * 1e9).toLong

  private def applyMessage(count: Int): Unit = {
    var i = 0
    while (i < count) {
      val row = rows(tickRnd.nextInt(rows.length))
      BenchmarkInstruments.mutateTick(tickRnd, row)
      table.processUpdate(row.ric, RowWithData(row.ric, BenchmarkInstruments.toFieldMap(row)))
      i += 1
    }
  }

  /** Fires totalUpdates as fast as possible, in messages of updatesPerMessage - mirrors ag-grid's own "stress test". */
  def fireBurst(totalUpdates: Int, updatesPerMessageArg: Int): BenchmarkBurstResult = {
    val messageSize = Math.max(1, updatesPerMessageArg)
    val start = System.currentTimeMillis()
    var remaining = totalUpdates
    while (remaining > 0) {
      val n = Math.min(messageSize, remaining)
      applyMessage(n)
      remaining -= n
    }
    val durationMs = Math.max(1L, System.currentTimeMillis() - start)
    val updatesPerSecondResult = totalUpdates.toDouble / (durationMs / 1000.0)
    BenchmarkBurstResult(totalUpdates, durationMs, updatesPerSecondResult)
  }

  override def runOnce(): Unit = {
    if (ticking) {
      // How late is this tick firing vs when it was scheduled to - the same
      // measurement TickEngine.ts takes client/feed-server-side, just taken
      // here on the server instead.
      val now = System.nanoTime()
      val driftMs = Math.max(0.0, (now - nextExpectedTimeNanos) / 1e6)
      streamTotalDriftMs += driftMs
      if (driftMs > streamMaxDriftMs) streamMaxDriftMs = driftMs

      applyMessage(updatesPerMessage)
      streamMessagesSent.incrementAndGet()
      streamRowsUpdated.addAndGet(updatesPerMessage.toLong)

      nextExpectedTimeNanos += intervalNanos
      val delayNanos = Math.max(0L, nextExpectedTimeNanos - System.nanoTime())
      timeProvider.sleep(Math.max(1L, delayNanos / 1000000L))
    } else {
      timeProvider.sleep(100)
    }
  }
}
