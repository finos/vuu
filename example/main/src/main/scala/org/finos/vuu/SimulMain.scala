package org.finos.vuu

import com.typesafe.config.{Config, ConfigFactory}
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.*
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.authn.AuthNModule
import org.finos.vuu.core.module.auths.PermissionModule
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.editable.EditableModule
import org.finos.vuu.core.module.metrics.MetricsModule
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.core.module.simul.SimulationModule
import org.finos.vuu.example.rest.client.{HttpClient, StubbedBackend}
import org.finos.vuu.example.rest.module.RestModule
import org.finos.vuu.example.virtualtable.module.VirtualTableModule
import org.finos.vuu.http2.server.VuuHttp2ServerFactory
import org.finos.vuu.http2.server.config.{AbsolutePathWebRoot, VuuHttp2ServerOptions}
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.http.HttpServerFactory
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin

/*
//to allow self signed certs
chrome://flags/#allow-insecure-localhost
 */

object SimulMain extends App with StrictLogging {

  JmxInfra.enableJmx()

  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

  val omsApi = OmsApi()

  logger.info("[VUU] Starting...")

  lifecycle.autoShutdownHook()

  private val loginTokenService = LoginTokenService()

  private val defaultConfig = ConfigFactory.load()

  val config = VuuServerConfig(
    createWebSocketOptions(defaultConfig),
    VuuSecurityOptions()
      .withLoginTokenService(loginTokenService),
    VuuThreadingOptions()
      .withViewPortThreads(4)
      .withTreeThreads(4),
    VuuClientConnectionOptions()
      .withHeartbeatEnabled(),
    httpServerFactory = createHttpServerFactory(defaultConfig)
  ).withModule(PriceModule())
    .withModule(SimulationModule())
    .withModule(MetricsModule())
    .withModule(AuthNModule(loginTokenService))
    .withModule(EditableModule())
    .withModule(PermissionModule())
    .withModule(BasketModule(omsApi))
    .withModule(RestModule(HttpClient(StubbedBackend()), defaultConfig.getConfig(ConfigKeys.restModuleConfig)))
    .withModule(VirtualTableModule())
    .withPlugin(VirtualizedTablePlugin)

  val vuuServer = new VuuServer(config)

  //  LifecycleGraphviz("vuu", lifecycle.dependencyGraph)

  lifecycle.start()

  logger.info("[VUU] Ready.")

  vuuServer.join()
}

object ConfigKeys {
  final val webroot = "vuu.webroot"
  final val sslEnabled = "vuu.ssl"
  final val certPath = "vuu.certPath"
  final val keyPath = "vuu.keyPath"
  final val restModuleConfig = "vuu.restModule"
}

private def createHttpServerFactory(c: Config): HttpServerFactory = {
  val options = VuuHttp2ServerOptions()
    .withWebRoot(AbsolutePathWebRoot(c.getString(ConfigKeys.webroot), directoryListings = true))
    .withPort(8443)

  if (c.getBoolean(ConfigKeys.sslEnabled)) {
    VuuHttp2ServerFactory(options.withSsl(
      VuuSSLByCertAndKey(c.getString(ConfigKeys.certPath), c.getString(ConfigKeys.keyPath))
    ))
  } else {
    VuuHttp2ServerFactory(options.withSslDisabled())
  }
}

private def createWebSocketOptions(c: Config): VuuWebSocketOptions = {
  val options = VuuWebSocketOptions()
    .withUri("websocket")
    .withWsPort(8090)
    .withBindAddress("0.0.0.0")

  if (c.getBoolean(ConfigKeys.sslEnabled)) {
    options.withSsl(VuuSSLByCertAndKey(c.getString(ConfigKeys.certPath), c.getString(ConfigKeys.keyPath)))
  } else {
    options.withSslDisabled()
  }
}
