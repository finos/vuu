package org.finos.vuu.example.clickhouse.provider

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.example.clickhouse.ClickHouseContainer
import org.finos.vuu.example.clickhouse.client.ClickHouseClient
import org.finos.vuu.example.clickhouse.client.options.ClickHouseClientOptions
import org.finos.vuu.example.clickhouse.module.ClickHouseTableModule
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.ViewPortRange
import org.scalatest.prop.Tables.Table

class ClickHouseVirtualizedDataProviderTest extends VuuServerTestCase with ForAllTestContainer {

  override val container: ClickHouseContainer = ClickHouseContainer()

  Feature("ClickHouse Virtualized Table Integration Test") {

    Scenario("Can create viewport, fetch range, and view data from ClickHouse") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withHost(container.getHost)
        .withPort(container.getPort))

      lifecycle.start()

      // Setup ClickHouse table and data
      client.executeUpdate(
        """
          |CREATE TABLE IF NOT EXISTS orders (
          |  orderId Int64,
          |  quantity Int32,
          |  price Int64,
          |  side String,
          |  trader String
          |) ENGINE = MergeTree() ORDER BY orderId
          |""".stripMargin
      )

      // Insert sample orders via HTTP CSV API streaming from a temp file
      val host = container.getHost
      val port = container.getPort
      val totalCount = 20_000_000

      val tempDir = java.nio.file.Paths.get("example/clickhouse-virtualized-table/target/temp-csv")
      java.nio.file.Files.createDirectories(tempDir)
      val tempFile = java.nio.file.Files.createTempFile(tempDir, "orders", ".csv")

      val fos = new java.io.FileOutputStream(tempFile.toFile)
      val bos = new java.io.BufferedOutputStream(fos, 8 * 1024 * 1024) // 8MB buffer
      val writer = new java.io.BufferedWriter(new java.io.OutputStreamWriter(bos, "UTF-8"))
      try {
        var currentId = 1
        while (currentId <= totalCount) {
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
          writer.write('\n')
          currentId += 1
        }
      } finally {
        writer.close()
      }

      try {
        org.finos.vuu.example.clickhouse.util.ClickHouseHttpIngester.ingestCsvFile(
          host,
          port,
          "orders",
          Seq("orderId", "quantity", "price", "side", "trader"),
          tempFile
        )
      } finally {
        java.nio.file.Files.deleteIfExists(tempFile)
      }

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable("clickhouseOrders")
        val columns = org.finos.vuu.core.table.ViewPortColumnCreator.create(table, table.getTableDef.getColumns.map(_.name).toList)
        val testServer = vuuServer.asInstanceOf[org.finos.vuu.test.impl.TestVuuServerImpl]
        val viewport = testServer.viewPortContainer.create(
          org.finos.vuu.client.messages.RequestId.oneNew(),
          testServer.user,
          testServer.session,
          testServer.queue,
          table,
          ViewPortRange(0, 5),
          columns,
          sort = org.finos.vuu.net.SortSpec(List(org.finos.vuu.net.SortDef("price", 'A'))),
          filterSpec = org.finos.vuu.net.FilterSpec("side = \"Buy\"")
        )

        val virtualizedProvider = viewport.table.asTable.getProvider.asInstanceOf[VirtualizedProvider]

        virtualizedProvider.runOnce(viewport)

        assertVpEq(combineQsForVp(viewport)) {
          Table(
            ("orderId" ,"quantity","price"   ,"side"    ,"trader"  ),
            ("10",10  ,100L,"Buy"     ,"trader-10"),
            ("2",2  ,20L,"Buy"     ,"trader-2"),
            ("4",4  ,40L,"Buy"     ,"trader-4"),
            ("6",6  ,60L,"Buy"     ,"trader-6"),
            ("8",8  ,80L,"Buy"     ,"trader-8")
          )
        }
      }
    }
  }
}
