package org.finos.vuu.plugin.clickhouse.provider

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.net.{FilterSpec, SortDef, SortSpec}
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule
import org.finos.vuu.plugin.clickhouse.util.ClickHouseCSVIngester
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.{DefaultRange, ViewPortRange}
import org.scalatest.prop.Tables.Table

class ClickHouseVirtualizedDataProviderTest extends VuuServerTestCase with ForAllTestContainer {

  override val container: ClickHouseContainer = ClickHouseContainer()

  Feature("ClickHouse Virtualized Table Integration Test") {

    Scenario("Can create viewport with no filter or sort") {

      given clock: Clock = new TestFriendlyClock(10001L)

      given lifecycle: LifecycleContainer = new LifecycleContainer()

      given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      given metricsProvider: MetricsProvider = new MetricsProviderImpl

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withEndpoint(container.getEndpoint)
        .withUsername(container.getUsername)
        .withPassword(container.getPassword))

      lifecycle.start()

      createOrderData(client, 50_000)

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable("orderHistory")
        val columns = org.finos.vuu.core.table.ViewPortColumnCreator.create(table, List("quantity", "price", "side", "trader"))
        val testServer = vuuServer.asInstanceOf[org.finos.vuu.test.impl.TestVuuServerImpl]
        val viewport = testServer.viewPortContainer.create(
          org.finos.vuu.client.messages.RequestId.oneNew(),
          testServer.user,
          testServer.session,
          testServer.queue,
          table,
          ViewPortRange(0, 5),
          columns
        )

        val virtualizedProvider = viewport.table.asTable.getProvider.asInstanceOf[VirtualizedProvider]

        virtualizedProvider.runOnce(viewport)

        var updates = combineQsForVp(viewport)
        updates.length shouldBe 6
//        assertVpEq(updates) {
//          Table(
//            ("quantity", "price", "side", "trader"),
//            (10, 100L, "Buy", "trader-10"),
//            (2, 20L, "Buy", "trader-2"),
//            (4, 40L, "Buy", "trader-4"),
//            (6, 60L, "Buy", "trader-6"),
//            (8, 80L, "Buy", "trader-8")
//          )
//        }

        //run with no changes
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 0
      }
    }

    Scenario("Can change range and see changes") {

      given clock: Clock = new TestFriendlyClock(10001L)

      given lifecycle: LifecycleContainer = new LifecycleContainer()

      given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      given metricsProvider: MetricsProvider = new MetricsProviderImpl

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withEndpoint(container.getEndpoint)
        .withUsername(container.getUsername)
        .withPassword(container.getPassword))

      lifecycle.start()

      createOrderData(client, 50_000)

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable("orderHistory")
        val columns = org.finos.vuu.core.table.ViewPortColumnCreator.create(table, List("quantity", "price", "side", "trader"))
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

        var updates = combineQsForVp(viewport)
        updates.length shouldBe 6
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (10, 100L, "Buy", "trader-10"),
            (2, 20L, "Buy", "trader-2"),
            (4, 40L, "Buy", "trader-4"),
            (6, 60L, "Buy", "trader-6"),
            (8, 80L, "Buy", "trader-8")
          )
        }

        //run with no changes
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 0

        //scroll down
        viewport.setRange(ViewPortRange(21_000, 21_005))
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 5
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (42002, 420020L, "Buy", "trader-42002"),
            (42004, 420040L, "Buy", "trader-42004"),
            (42006, 420060L, "Buy", "trader-42006"),
            (42008, 420080L, "Buy", "trader-42008"),
            (42010, 420100L, "Buy", "trader-42010")
          )
        }

        //Jump to end
        viewport.setRange(ViewPortRange(24_995, 25_000))
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 5
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (49992, 499920L, "Buy", "trader-49992"),
            (49994, 499940L, "Buy", "trader-49994"),
            (49996, 499960L, "Buy", "trader-49996"),
            (49998, 499980L, "Buy", "trader-49998"),
            (50000, 500000L, "Buy", "trader-50000")
          )
        }

        //Jump to beginning
        viewport.setRange(ViewPortRange(0, 5))
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 5
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (10, 100L, "Buy", "trader-10"),
            (2, 20L, "Buy", "trader-2"),
            (4, 40L, "Buy", "trader-4"),
            (6, 60L, "Buy", "trader-6"),
            (8, 80L, "Buy", "trader-8")
          )
        }
      }
    }

    Scenario("Can change filter and see changes") {

      given clock: Clock = new TestFriendlyClock(10001L)

      given lifecycle: LifecycleContainer = new LifecycleContainer()

      given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      given metricsProvider: MetricsProvider = new MetricsProviderImpl

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withEndpoint(container.getEndpoint)
        .withUsername(container.getUsername)
        .withPassword(container.getPassword))

      lifecycle.start()

      createOrderData(client, 50_000)

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable("orderHistory")
        val columns = org.finos.vuu.core.table.ViewPortColumnCreator.create(table, List("quantity", "price", "side", "trader"))
        val testServer = vuuServer.asInstanceOf[org.finos.vuu.test.impl.TestVuuServerImpl]
        var viewport = testServer.viewPortContainer.create(
          org.finos.vuu.client.messages.RequestId.oneNew(),
          testServer.user,
          testServer.session,
          testServer.queue,
          table,
          ViewPortRange(0, 5),
          columns,
          sort = SortSpec(List(SortDef("price", 'A'))),
          filterSpec = FilterSpec("side = \"Buy\"")
        )

        val virtualizedProvider = viewport.table.asTable.getProvider.asInstanceOf[VirtualizedProvider]

        virtualizedProvider.runOnce(viewport)

        var updates = combineQsForVp(viewport)
        updates.length shouldBe 6
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (10, 100L, "Buy", "trader-10"),
            (2, 20L, "Buy", "trader-2"),
            (4, 40L, "Buy", "trader-4"),
            (6, 60L, "Buy", "trader-6"),
            (8, 80L, "Buy", "trader-8")
          )
        }

        //run with no changes
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 0

        //change filter
        viewport = testServer.viewPortContainer
          .change(RequestId.oneNew(), testServer.session, viewport.id, DefaultRange, columns,
            filterSpec = FilterSpec("trader = \"trader-4\""))

        updates = combineQsForVp(viewport)
        updates.length shouldBe 0

        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 2
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (4, 40L, "Buy", "trader-4")
          )
        }
      }
    }

    Scenario("Can change sort and see changes") {

      given clock: Clock = new TestFriendlyClock(10001L)

      given lifecycle: LifecycleContainer = new LifecycleContainer()

      given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      given metricsProvider: MetricsProvider = new MetricsProviderImpl

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withEndpoint(container.getEndpoint)
        .withUsername(container.getUsername)
        .withPassword(container.getPassword))

      lifecycle.start()

      createOrderData(client, 50_000)

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable("orderHistory")
        val columns = org.finos.vuu.core.table.ViewPortColumnCreator.create(table, List("quantity", "price", "side", "trader"))
        val testServer = vuuServer.asInstanceOf[org.finos.vuu.test.impl.TestVuuServerImpl]
        var viewport = testServer.viewPortContainer.create(
          org.finos.vuu.client.messages.RequestId.oneNew(),
          testServer.user,
          testServer.session,
          testServer.queue,
          table,
          ViewPortRange(0, 5),
          columns,
          sort = SortSpec(List(SortDef("price", 'A'))),
          filterSpec = FilterSpec("side = \"Buy\"")
        )

        val virtualizedProvider = viewport.table.asTable.getProvider.asInstanceOf[VirtualizedProvider]

        virtualizedProvider.runOnce(viewport)

        var updates = combineQsForVp(viewport)
        updates.length shouldBe 6
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (10, 100L, "Buy", "trader-10"),
            (2, 20L, "Buy", "trader-2"),
            (4, 40L, "Buy", "trader-4"),
            (6, 60L, "Buy", "trader-6"),
            (8, 80L, "Buy", "trader-8")
          )
        }

        //run with no changes
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 0

        //change filter
        viewport = testServer.viewPortContainer
          .change(RequestId.oneNew(), testServer.session, viewport.id, DefaultRange, columns,
            sort = SortSpec(List(SortDef("price", 'D'))),
            filterSpec = FilterSpec("side = \"Buy\""))

        updates = combineQsForVp(viewport)
        updates.length shouldBe 0

        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 5
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (49992, 499920L, "Buy", "trader-49992"),
            (49994, 499940L, "Buy", "trader-49994"),
            (49996, 499960L, "Buy", "trader-49996"),
            (49998, 499980L, "Buy", "trader-49998"),
            (50000, 500000L, "Buy", "trader-50000")
          )
        }
      }

    }

  }

  private def createOrderData(client: ClickHouseClient, totalCount: Int): Unit = {

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
        container.getUsername,
        container.getPassword,
        "order_history",
        Seq("order_id", "quantity", "price", "side", "trader"),
        tempFile
      )
    } finally {
      java.nio.file.Files.deleteIfExists(tempFile)
    }

  }

}
