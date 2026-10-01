package org.finos.vuu

import com.typesafe.config.ConfigFactory
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.*
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.price.BenchmarkPriceModule
import org.finos.vuu.net.auth.LoginTokenService

/**
 * Minimal server entry point for the vuu-ui perf benchmark
 * (sample-apps/perf-benchmark): loads only BenchmarkPriceModule, none of
 * SimulMain's other demo modules (baskets, permissions, metrics, editable,
 * rest, virtual tables etc). Those modules run their own background tick
 * loops and reference data that compete for heap/CPU with the benchmark's
 * own 10k/100k row tables for no benefit here - a clean process gives both
 * more headroom and a quieter, more attributable measurement.
 *
 * No HTTP2/webroot/SSL setup - websocket only, matching how the perf
 * benchmark app connects (ws://localhost:8090/websocket, authenticate=false).
 */
object BenchmarkMain extends App with StrictLogging {

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

  logger.info("[VUU][Benchmark] Starting...")

  lifecycle.autoShutdownHook()

  // Accepts any token - this server is for local benchmarking only, bound to
  // localhost only, so there's no reason to run the full HTTP2/token-issuing
  // auth flow SimulMain uses.
  private val loginTokenService = LoginTokenService(VuuUser("benchmark"))
  private val defaultConfig = ConfigFactory.load()

  val config = VuuServerConfig(
    VuuWebSocketOptions()
      .withUri("websocket")
      .withWsPort(8090)
      .withBindAddress("localhost")
      .withSslDisabled(),
    VuuSecurityOptions()
      .withLoginTokenService(loginTokenService),
    VuuThreadingOptions()
      .withViewPortThreads(4)
      .withTreeThreads(4),
    VuuClientConnectionOptions()
      .withHeartbeatEnabled()
  ).withModule(BenchmarkPriceModule())

  val vuuServer = new VuuServer(config)

  lifecycle.start()

  logger.info("[VUU][Benchmark] Ready.")

  vuuServer.join()
}
