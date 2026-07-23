package org.finos.toolbox.jmx

import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import io.micrometer.core.instrument.{Clock, Counter, DistributionSummary, MeterRegistry}
import io.micrometer.jmx.{JmxConfig, JmxMeterRegistry}


trait MetricsProvider{
  def meter(name: String): Counter
  def counter(name: String): Counter
  def histogram(name: String): DistributionSummary
}

class MetricsProviderImpl() extends MetricsProvider{

  final val metrics: MeterRegistry =
    if (JmxInfra.isJmxEnabled) new JmxMeterRegistry(JmxConfig.DEFAULT, Clock.SYSTEM)
    else new SimpleMeterRegistry()

  override def histogram(name: String): DistributionSummary =
    DistributionSummary.builder(name)
      .publishPercentiles(0.5, 0.75, 0.99, 0.999)
      .register(metrics)

  override def meter(name: String): Counter = metrics.counter(name)

  override def counter(name: String): Counter = metrics.counter(name)

}
