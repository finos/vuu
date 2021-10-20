/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 08/01/2016.

  */
package io.venuu.toolbox.jmx

import com.codahale.metrics._


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

