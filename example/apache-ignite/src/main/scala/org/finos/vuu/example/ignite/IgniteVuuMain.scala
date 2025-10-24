package org.finos.vuu.example.ignite

import com.typesafe.config.ConfigFactory
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.*
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.metrics.MetricsModule
import org.finos.vuu.example.ignite.loader.IgniteOrderGenerator
import org.finos.vuu.example.ignite.module.IgniteOrderDataModule
import org.finos.vuu.net.auth.{Authenticator, LoginTokenService}
import org.finos.vuu.net.http.{AbsolutePathWebRoot, VuuHttp2ServerOptions}
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin
import org.finos.vuu.state.MemoryBackedVuiStateStore

/*
//to allow self signed certs
chrome://flags/#allow-insecure-localhost
 */

object IgniteVuuMain extends App with StrictLogging {

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

  logger.info("[VUU] Starting...")
  val runAsIgniteServer = false

  val store = new MemoryBackedVuiStateStore()

  //store.add(VuiState(VuiHeader("chris", "latest", "chris.latest", clock.now()), VuiJsonState("{ uiState : ['chris','foo'] }")))

  lifecycle.autoShutdownHook()

  val loginTokenService = LoginTokenService.apply(VuuUser("test"))

  val defaultConfig = ConfigFactory.load()

  //look in application.conf for default values
  val webRoot = defaultConfig.getString("vuu.webroot")
  val certPath = defaultConfig.getString("vuu.certPath")
  val keyPath = defaultConfig.getString("vuu.keyPath")

  logger.debug(s"[Ignite] Starting ignite in ${if(runAsIgniteServer) "Server" else "Client"} mode")
  private val igniteOrderStore = IgniteOrderStore(clientMode = !runAsIgniteServer)
  if(runAsIgniteServer)
    SaveOrdersInIgnite()

  val config = VuuServerConfig(
    VuuHttp2ServerOptions()
      .withWebRoot(AbsolutePathWebRoot(webRoot, directoryListings = true))
      .withSsl(VuuSSLByCertAndKey(certPath, keyPath))
      .withBindAddress("0.0.0.0")
      .withPort(8443),
    VuuWebSocketOptions()
      .withUri("websocket")
      .withWsPort(8090)
      .withSsl(VuuSSLByCertAndKey(certPath, keyPath))
      .withBindAddress("0.0.0.0"),
    VuuSecurityOptions()
      .withLoginTokenService(loginTokenService),
    VuuThreadingOptions()
      .withViewPortThreads(4)
      .withTreeThreads(4)
  ).withModule(MetricsModule())
    .withModule(IgniteOrderDataModule(igniteOrderStore))
    .withPlugin(VirtualizedTablePlugin)

  val vuuServer = new VuuServer(config)

  lifecycle.start()

  logger.info("[VUU] Ready.")

  vuuServer.join()

  private def SaveOrdersInIgnite(): Unit = {
    val igniteOrderGenerator = new IgniteOrderGenerator(igniteOrderStore)
    igniteOrderGenerator.save()
  }

}
