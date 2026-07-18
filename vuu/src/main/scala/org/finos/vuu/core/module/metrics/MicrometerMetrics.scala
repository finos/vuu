package org.finos.vuu.core.module.metrics

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.distribution.HistogramSnapshot
import org.finos.toolbox.time.Clock

/**
 * Computes a per-second rate from a monotonically increasing counter by sampling
 * it on each call. Dropwizard meters exposed a one-minute exponentially weighted
 * rate; Micrometer counters leave rate computation to the consumer, so the
 * providers that used to read getOneMinuteRate sample the counter on their run
 * cycle instead.
 */
class CounterRatePerSecond(counter: Counter)(implicit clock: Clock) {

  private var lastTimeMillis: Long = clock.now()
  private var lastCount: Double = counter.count()

  def perSecond(): Double = {
    val nowMillis = clock.now()
    val count = counter.count()
    val elapsedMillis = nowMillis - lastTimeMillis
    val rate = if (elapsedMillis <= 0) 0.0 else (count - lastCount) * 1000.0 / elapsedMillis
    lastTimeMillis = nowMillis
    lastCount = count
    rate
  }
}

object MicrometerMetrics {

  /**
   * Returns the value recorded for a percentile the summary was configured to
   * publish (see MetricsProviderImpl), or 0.0 when nothing has been recorded.
   */
  def percentileValue(snapshot: HistogramSnapshot, percentile: Double): Double =
    snapshot.percentileValues()
      .find(pv => math.abs(pv.percentile() - percentile) < 1e-6)
      .map(_.value())
      .getOrElse(0.0)
}
