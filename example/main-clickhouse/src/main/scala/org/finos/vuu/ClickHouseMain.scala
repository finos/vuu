package org.finos.vuu

import com.typesafe.config.{Config, ConfigFactory}
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.ClickHouseMain.logger
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.authn.AuthNModule
import org.finos.vuu.core.{VuuClientConnectionOptions, VuuSecurityOptions, VuuServer, VuuServerConfig, VuuThreadingOptions, VuuWebSocketOptions}
import org.finos.vuu.http2.server.VuuHttp2ServerFactory
import org.finos.vuu.http2.server.config.{AbsolutePathWebRoot, VuuHttp2ServerOptions}
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.http.HttpServerFactory
import org.finos.vuu.net.ssl.VuuSSLByCertAndKey
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule
import org.finos.vuu.plugin.clickhouse.util.ClickHouseOrderCreator
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin

object ClickHouseMain extends App with StrictLogging {

  JmxInfra.enableJmx()

  logger.info("[ClickHouse] Starting...")

  private val container: ClickHouseContainer = ClickHouseContainer()
  container.start()
  ClickHouseOrderCreator.createOrderData(container, 10_000_000)

  logger.info("[ClickHouse] Ready.")

  logger.info("[VUU] Starting...")

  given metrics: MetricsProvider = new MetricsProviderImpl
  given clock: Clock = new DefaultClock
  given lifecycle: LifecycleContainer = new LifecycleContainer
  given tableDefContainer: TableDefContainer = new TableDefContainer(Map())
  lifecycle.autoShutdownHook()

  private val loginTokenService = LoginTokenService()
  private val defaultConfig = ConfigFactory.load()

  private val client = ClickHouseClient(ClickHouseClientOptions()
    .withEndpoint(container.getEndpoint)
    .withUsername(container.getDefaultUsername)
    .withPassword(container.getDefaultPassword))

  private val config = VuuServerConfig(
    createWebSocketOptions(defaultConfig),
    VuuSecurityOptions()
      .withLoginTokenService(loginTokenService),
    VuuThreadingOptions()
      .withViewPortThreads(4)
      .withTreeThreads(4),
    VuuClientConnectionOptions()
      .withHeartbeatEnabled(),
    httpServerFactory = createHttpServerFactory(defaultConfig)
  ).withModule(AuthNModule(loginTokenService))
    .withModule(ClickHouseTableModule(client))
    .withPlugin(VirtualizedTablePlugin)

  private val vuuServer = new VuuServer(config)

  lifecycle.start()

  logger.info("[VUU] Ready.")

  vuuServer.join()

  container.stop()
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
