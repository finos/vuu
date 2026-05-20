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

      // Insert 10 sample orders
      for (i <- 1 to 10) {
        val side = if (i % 2 == 0) "Buy" else "Sell"
        client.executeUpdate(s"INSERT INTO orders (orderId, quantity, price, side, trader) VALUES ($i, ${i * 100}, ${i * 10}, '$side', 'trader-$i')")
      }

      withVuuServer(ClickHouseTableModule(client)) { vuuServer =>

        vuuServer.registerPlugin(VirtualizedTablePlugin)

        vuuServer.login("testUser")

        val viewport = vuuServer.createViewPort(ClickHouseTableModule.NAME, "clickhouseOrders", ViewPortRange(0, 5))

        val virtualizedProvider = viewport.table.asTable.getProvider.asInstanceOf[VirtualizedProvider]

        virtualizedProvider.runOnce(viewport)

        assertVpEq(combineQsForVp(viewport)) {
          Table(
            ("orderId" ,"quantity","price"   ,"side"    ,"trader"  ),
            ("1"       ,100       ,10L       ,"Sell"    ,"trader-1"),
            ("2"       ,200       ,20L       ,"Buy"     ,"trader-2"),
            ("3"       ,300       ,30L       ,"Sell"    ,"trader-3"),
            ("4"       ,400       ,40L       ,"Buy"     ,"trader-4"),
            ("5"       ,500       ,50L       ,"Sell"    ,"trader-5")
          )
        }
      }
    }
  }
}
