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
import org.finos.vuu.plugin.clickhouse.util.ClickHouseCSVIngester
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin

object ClickHouseMain extends App with StrictLogging {

  JmxInfra.enableJmx()

  given metrics: MetricsProvider = new MetricsProviderImpl
  given clock: Clock = new DefaultClock
  given lifecycle: LifecycleContainer = new LifecycleContainer
  given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

  private val container: ClickHouseContainer = ClickHouseContainer()
  private val loginTokenService = LoginTokenService()
  private val defaultConfig = ConfigFactory.load()

  container.start()

  logger.info("[VUU] Starting...")

  lifecycle.autoShutdownHook()

  val client = ClickHouseClient(ClickHouseClientOptions()
    .withEndpoint(container.getEndpoint)
    .withUsername(container.getDefaultUsername)
    .withPassword(container.getDefaultPassword))

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
  ).withModule(AuthNModule(loginTokenService))
    .withModule(ClickHouseTableModule(client))
    .withPlugin(VirtualizedTablePlugin)

  val vuuServer = new VuuServer(config)

  lifecycle.start()

  createOrderData(container, client, 10_000_000)

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

private def createOrderData(container: ClickHouseContainer, client: ClickHouseClient, totalCount: Int): Unit = {

  client.executeUpdate("DROP TABLE IF EXISTS order_history")

  client.executeUpdate(
    """
      |CREATE TABLE IF NOT EXISTS order_history (
      |  order_id Int64,
      |  quantity Int32,
      |  price Int64,
      |  side String,
      |  trader String
      |) ENGINE = MergeTree() ORDER BY order_id
      |""".stripMargin
  )

  // Insert sample orders via HTTP CSV API streaming from a temp file

  val tempDir = java.nio.file.Paths.get("target/temp-csv")
  java.nio.file.Files.createDirectories(tempDir)
  val tempFile = java.nio.file.Files.createTempFile(tempDir, "order_history", ".csv")

  val fos = new java.io.FileOutputStream(tempFile.toFile)
  val bos = new java.io.BufferedOutputStream(fos, 8 * 1024 * 1024) // 8MB buffer
  val writer = new java.io.BufferedWriter(new java.io.OutputStreamWriter(bos, "UTF-8"))
  try {
    var currentId = 1
    while (currentId <= totalCount) {
      val now = System.currentTimeMillis().toString
      val side = if (currentId % 2 == 0) "Buy" else "Sell"
      val price = currentId * 10L
      val quantity = currentId
      writer.write(currentId.toString)
      writer.write(',')
      writer.write(quantity.toString)
      writer.write(',')
      writer.write(price.toString)
      writer.write(',')
      writer.write(side)
      writer.write(",trader-")
      writer.write(currentId.toString)
      writer.write(System.lineSeparator())
      currentId += 1
    }
  } finally {
    writer.close()
  }

  try {
    ClickHouseCSVIngester.ingestCsvFile(
      container.getEndpoint,
      container.getDefaultUsername,
      container.getDefaultPassword,
      "order_history",
      Seq("order_id", "quantity", "price", "side", "trader"),
      tempFile
    )
  } finally {
    java.nio.file.Files.deleteIfExists(tempFile)
  }

}
