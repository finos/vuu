package org.finos.vuu.example.ignite

import io.opencensus.exporter.stats.prometheus.PrometheusStatsCollector
import io.prometheus.client.exporter.HTTPServer
import org.apache.ignite.Ignition

import scala.annotation.unused

object StartIgniteMain extends App {
  PrometheusStatsCollector.createAndRegister()
  private val config = IgniteLocalConfig.create(clientMode = false)
  @unused val httpServer = new HTTPServer(config.metricsPort, true)
  val ignite = Ignition.getOrStart(config.igniteConfiguration())
}
