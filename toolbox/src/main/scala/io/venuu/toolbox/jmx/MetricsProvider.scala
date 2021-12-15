package io.venuu.toolbox.jmx

import com.codahale.metrics._
import com.codahale.metrics.jmx._


trait MetricsProvider{
  def meter(name: String): Meter
  def counter(name: String): Counter
  def histogram(name: String): Histogram
}

class MetricsProviderImpl() extends MetricsProvider{
  final val metrics = new MetricRegistry()

  @volatile var reporter: JmxReporter = null

  override def histogram(name: String): Histogram = metrics.histogram(name)
  override def meter(name: String): Meter = metrics.meter(name)
  override def counter(name: String): Counter = metrics.counter(name)

  if(JmxInfra.isJmxEnabled){
    reporter = JmxReporter.forRegistry(metrics).build()
    reporter.start()
  }

}

