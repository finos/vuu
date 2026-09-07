package org.finos.vuu.plugin.clickhouse.provider

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.table.datatype.Scale.Six
import org.finos.vuu.core.table.datatype.ScaledDecimal
import org.finos.vuu.net.{FilterSpec, SortDef, SortSpec}
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule.{NO_SELL_TABLE_NAME, TABLE_NAME}
import org.finos.vuu.plugin.clickhouse.util.ClickHouseOrderCreator
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.{DefaultRange, ViewPortRange}
import org.scalatest.prop.Tables.Table

class ClickHouseVirtualizedDataProviderTest extends VuuServerTestCase with ForAllTestContainer {

  override val container: ClickHouseContainer = ClickHouseContainer()

  override def afterStart(): Unit = {
    ClickHouseOrderCreator.createOrderData(container, 50_000)
  }
  
  Feature("ClickHouse Virtualized Table Integration Test") {

    Scenario("Can create viewport with no filter or sort") {

      given clock: Clock = new TestFriendlyClock(10001L)

      given lifecycle: LifecycleContainer = new LifecycleContainer()

      given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      given metricsProvider: MetricsProvider = new MetricsProviderImpl

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withEndpoint(container.getEndpoint)
        .withUsername(container.getDefaultUsername)
        .withPassword(container.getDefaultPassword))

      lifecycle.start()

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable(TABLE_NAME)
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
        .withUsername(container.getDefaultUsername)
        .withPassword(container.getDefaultPassword))

      lifecycle.start()

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable(TABLE_NAME)
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
            (10, ScaledDecimal("100", Six), "Buy", "trader-10"),
            (2, ScaledDecimal("20", Six), "Buy", "trader-2"),
            (4, ScaledDecimal("40", Six), "Buy", "trader-4"),
            (6, ScaledDecimal("60", Six), "Buy", "trader-6"),
            (8, ScaledDecimal("80", Six), "Buy", "trader-8")
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
            (42002, ScaledDecimal("420020", Six), "Buy", "trader-42002"),
            (42004, ScaledDecimal("420040", Six), "Buy", "trader-42004"),
            (42006, ScaledDecimal("420060", Six), "Buy", "trader-42006"),
            (42008, ScaledDecimal("420080", Six), "Buy", "trader-42008"),
            (42010, ScaledDecimal("420100", Six), "Buy", "trader-42010")
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
            (49992, ScaledDecimal("499920", Six), "Buy", "trader-49992"),
            (49994, ScaledDecimal("499940", Six), "Buy", "trader-49994"),
            (49996, ScaledDecimal("499960", Six), "Buy", "trader-49996"),
            (49998, ScaledDecimal("499980", Six), "Buy", "trader-49998"),
            (50000, ScaledDecimal("500000", Six), "Buy", "trader-50000")
          )
        }

        //Jump to beyond end
        viewport.setRange(ViewPortRange(25_000, 25_005))
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 0

        //Jump to end again
        viewport.setRange(ViewPortRange(24_995, 25_000))
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 5
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (49992, ScaledDecimal("499920", Six), "Buy", "trader-49992"),
            (49994, ScaledDecimal("499940", Six), "Buy", "trader-49994"),
            (49996, ScaledDecimal("499960", Six), "Buy", "trader-49996"),
            (49998, ScaledDecimal("499980", Six), "Buy", "trader-49998"),
            (50000, ScaledDecimal("500000", Six), "Buy", "trader-50000")
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
            (10, ScaledDecimal("100", Six), "Buy", "trader-10"),
            (2, ScaledDecimal("20", Six), "Buy", "trader-2"),
            (4, ScaledDecimal("40", Six), "Buy", "trader-4"),
            (6, ScaledDecimal("60", Six), "Buy", "trader-6"),
            (8, ScaledDecimal("80", Six), "Buy", "trader-8")
          )
        }

        //Jump twice between reloads
        viewport.setRange(ViewPortRange(5, 10))
        viewport.setRange(ViewPortRange(10, 15))
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 5
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (22, ScaledDecimal("220", Six), "Buy", "trader-22"),
            (24, ScaledDecimal("240", Six), "Buy", "trader-24"),
            (26, ScaledDecimal("260", Six), "Buy", "trader-26"),
            (28, ScaledDecimal("280", Six), "Buy", "trader-28"),
            (30, ScaledDecimal("300", Six), "Buy", "trader-30")
          )
        }

        //Invalid range
        val ex = intercept[Exception] {
          viewport.setRange(ViewPortRange(0, Int.MaxValue))
        }
        ex.getMessage.startsWith("Requested range exceeded settings in view port VP-") shouldEqual true
      }
    }

    Scenario("Can change filter and see changes") {

      given clock: Clock = new TestFriendlyClock(10001L)

      given lifecycle: LifecycleContainer = new LifecycleContainer()

      given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      given metricsProvider: MetricsProvider = new MetricsProviderImpl

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withEndpoint(container.getEndpoint)
        .withUsername(container.getDefaultUsername)
        .withPassword(container.getDefaultPassword))

      lifecycle.start()

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable(TABLE_NAME)
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
          filterSpec = FilterSpec("side = \"Buy\" and time != 0")
        )

        val virtualizedProvider = viewport.table.asTable.getProvider.asInstanceOf[VirtualizedProvider]

        virtualizedProvider.runOnce(viewport)

        var updates = combineQsForVp(viewport)
        updates.length shouldBe 6
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (10, ScaledDecimal("100", Six), "Buy", "trader-10"),
            (2, ScaledDecimal("20", Six), "Buy", "trader-2"),
            (4, ScaledDecimal("40", Six), "Buy", "trader-4"),
            (6, ScaledDecimal("60", Six), "Buy", "trader-6"),
            (8, ScaledDecimal("80", Six), "Buy", "trader-8")
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
            (4, ScaledDecimal("40", Six), "Buy", "trader-4")
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
        .withUsername(container.getDefaultUsername)
        .withPassword(container.getDefaultPassword))

      lifecycle.start()

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable(TABLE_NAME)
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
            (10, ScaledDecimal("100", Six), "Buy", "trader-10"),
            (2, ScaledDecimal("20", Six), "Buy", "trader-2"),
            (4, ScaledDecimal("40", Six), "Buy", "trader-4"),
            (6, ScaledDecimal("60", Six), "Buy", "trader-6"),
            (8, ScaledDecimal("80", Six), "Buy", "trader-8")
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
            (49992, ScaledDecimal("499920", Six), "Buy", "trader-49992"),
            (49994, ScaledDecimal("499940", Six), "Buy", "trader-49994"),
            (49996, ScaledDecimal("499960", Six), "Buy", "trader-49996"),
            (49998, ScaledDecimal("499980", Six), "Buy", "trader-49998"),
            (50000, ScaledDecimal("500000", Six), "Buy", "trader-50000")
          )
        }
      }

    }

    Scenario("Can create viewport with permission filter") {

      given clock: Clock = new TestFriendlyClock(10001L)

      given lifecycle: LifecycleContainer = new LifecycleContainer()

      given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      given metricsProvider: MetricsProvider = new MetricsProviderImpl

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withEndpoint(container.getEndpoint)
        .withUsername(container.getDefaultUsername)
        .withPassword(container.getDefaultPassword))

      lifecycle.start()
      
      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val table = vuuServer.tableContainer.getTable(NO_SELL_TABLE_NAME)
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
          filterSpec = FilterSpec("side = \"Sell\" or side = \"Buy\"")
        )

        val virtualizedProvider = viewport.table.asTable.getProvider.asInstanceOf[VirtualizedProvider]

        virtualizedProvider.runOnce(viewport)

        var updates = combineQsForVp(viewport)
        updates.length shouldBe 6
        assertVpEq(updates) {
          Table(
            ("quantity", "price", "side", "trader"),
            (10, ScaledDecimal("100", Six), "Buy", "trader-10"),
            (2, ScaledDecimal("20", Six), "Buy", "trader-2"),
            (4, ScaledDecimal("40", Six), "Buy", "trader-4"),
            (6, ScaledDecimal("60", Six), "Buy", "trader-6"),
            (8, ScaledDecimal("80", Six), "Buy", "trader-8")
          )
        }

        //run with no changes
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 0

        //change filter
        viewport = testServer.viewPortContainer
          .change(RequestId.oneNew(), testServer.session, viewport.id, DefaultRange, columns,
            sort = SortSpec(List(SortDef("price", 'A'))),
            filterSpec = FilterSpec("side = \"Sell\""))

        updates = combineQsForVp(viewport)
        updates.length shouldBe 0

        //should return nothing because we cant see sells.
        virtualizedProvider.runOnce(viewport)
        updates = combineQsForVp(viewport)
        updates.length shouldBe 1
        updates.head.size shouldBe 0
      }

    }

  }

}
