package org.finos.vuu.core.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.{DefaultRange, ViewPort, ViewPortContainer}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class InMemColumnValueProviderTest extends AnyFeatureSpec with Matchers {

  Feature("InMemColumnValueProvider") {

    Scenario("Get all unique value of a given column") {
      val (table, provider, viewPortContainer, viewPort) = setup()
      provider.tick("1", Map("id" -> "1", "ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> "BT.L", "bid" -> 500, "ask" -> 550))
      provider.tick("3", Map("id" -> "3", "ric" -> "VOD.L", "bid" -> 240, "ask" -> 244))
      viewPortContainer.runOnce()
      val columnValueProvider = new InMemColumnValueProvider(table)

      val uniqueValues = columnValueProvider.getUniqueValuesVPColumn("ric", viewPort)

      uniqueValues should contain theSameElementsAs Vector("BT.L", "VOD.L")
    }

    Scenario("Get all unique value of a given column filtering out null") {
      val (table, provider, viewPortContainer, viewPort) = setup()
      provider.tick("1", Map("id" -> "1", "ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> null, "bid" -> 500, "ask" -> 550))
      provider.tick("3", Map("id" -> "3", "ric" ->  "VOD.L", "bid" -> 240, "ask" -> 244))
      viewPortContainer.runOnce()
      val columnValueProvider = new InMemColumnValueProvider(table)

      val uniqueValues = columnValueProvider.getUniqueValuesVPColumn("ric", viewPort)

      uniqueValues should contain theSameElementsAs Vector("VOD.L")
    }

    Scenario("Get all unique value of a given column returns empty when all values are null") {
      val (table, provider, viewPortContainer, viewPort) = setup()
      provider.tick("1", Map("id" -> "1", "ric" -> null, "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> null, "bid" -> 500, "ask" -> 550))
      viewPortContainer.runOnce()
      val columnValueProvider = new InMemColumnValueProvider(table)

      val uniqueValues = columnValueProvider.getUniqueValuesVPColumn("ric", viewPort)

      uniqueValues shouldBe empty
    }

    Scenario("Get all unique value of a given column that starts with specified string") {
      val (table, provider, viewPortContainer, viewPort) = setup()
      provider.tick("1", Map("id" -> "1", "ric" -> "VOA.L", "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> "BT.L", "bid" -> 500, "ask" -> 550))
      provider.tick("3", Map("id" -> "3", "ric" -> "VOV.L", "bid" -> 240, "ask" -> 244))
      provider.tick("4", Map("id" -> "4", "ric" -> null, "bid" -> 240, "ask" -> 244))
      viewPortContainer.runOnce()
      val columnValueProvider = new InMemColumnValueProvider(table)

      val uniqueValues = columnValueProvider.getUniqueValuesStartingWithVPColumn("ric", "VO", viewPort)

      uniqueValues should contain theSameElementsAs Vector("VOA.L", "VOV.L")
    }

    Scenario("Get all unique value of a given column that starts with specified string case insensitive") {
      val (table, provider, viewPortContainer, viewPort) = setup()
      provider.tick("1", Map("id" -> "1", "ric" -> "VOA.L", "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> "BT.L", "bid" -> 500, "ask" -> 550))
      provider.tick("3", Map("id" -> "3", "ric" -> "VOV.L", "bid" -> 240, "ask" -> 244))
      provider.tick("4", Map("id" -> "4", "ric" -> null, "bid" -> 240, "ask" -> 244))
      viewPortContainer.runOnce()
      val columnValueProvider = new InMemColumnValueProvider(table)

      val uniqueValues = columnValueProvider.getUniqueValuesStartingWithVPColumn("ric", "vo", viewPort)

      uniqueValues should contain theSameElementsAs Vector("VOA.L", "VOV.L")
    }

  }

  private def setup(): (DataTable, MockProvider, ViewPortContainer, ViewPort) = {
    given clock: Clock = new TestFriendlyClock(10001L)
    given lifecycle: LifecycleContainer = new LifecycleContainer()
    given metricsProvider: MetricsProvider = new MetricsProviderImpl

    val pricesDef: TableDef = TableDef(
      "prices",
      "id",
      Columns.fromNames("id:Long", "ric:String", "bid:Double", "ask:Double"),
    )

    val joinProvider = JoinTableProviderImpl()
    val tableContainer = new TableContainer(joinProvider)
    val pricesTable = tableContainer.createTable(pricesDef)
    val priceProvider = new MockProvider(pricesTable)

    val providerContainer = new ProviderContainer(joinProvider)
    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)
    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

    val vpColumns = ViewPortColumnCreator.create(pricesTable)
    val user = VuuUser("chris")
    val session = ClientSessionId("sess-01", "channel")
    val outQueue = new OutboundRowPublishQueue()
    val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, pricesTable, DefaultRange, vpColumns)

    (pricesTable, priceProvider, viewPortContainer, viewPort)
  }
}
