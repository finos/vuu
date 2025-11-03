package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.TableTestHelper.*
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.{DefaultRange, ViewPortContainer}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DataTableTest extends AnyFeatureSpec with Matchers {

  private implicit val timeProvider: Clock = new DefaultClock
  private implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  private implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

  private val joinProvider = JoinTableProviderImpl()
  private val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

  Feature("Test data table functionality"){

    Scenario("When we tick a value through our mock provider, check it arrives in our listener"){

      val tableContainer = new TableContainer(joinProvider)
      val outQueue          = new OutboundRowPublishQueue()
      val providerContainer = new ProviderContainer(joinProvider)
      val pluginRegistry = new DefaultPluginRegistry
      pluginRegistry.registerPlugin(new VuuInMemPlugin)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      val table = new InMemDataTable(pricesDef, joinProvider)

      val provider = new MockProvider(table)

      val user: VuuUser = VuuUser("chris")
      
      val session = ClientSessionId("sess-01", "channel")

      val vpcolumns = List("ric", "bid", "ask")

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, table, DefaultRange, ViewPortColumnCreator.create(table, vpcolumns))

      provider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))

      table.primaryKeys.length should equal (1)

      viewPortContainer.runOnce()

      val viewPortUpdate = combineQs(viewPort)

      viewPortUpdate(1).key.key should equal( "VOD.L")
    }
  }


  Feature("hasRowChanged") {
    val key = "VOD.L"
    val row = RowWithData(key, Map("ric" -> "VOD.L", "bid" -> 210))
    val table = new InMemDataTable(pricesDef, joinProvider)
    table.processUpdate(key, row)

    Scenario("WHEN row has changed at a given key THEN should return true") {
      val newRowAtSameKey = row.copy(data = row.data ++ Map("bid" -> 300))
      table.hasRowChanged(newRowAtSameKey) should equal(true)
    }

    Scenario("WHEN row stays the same but key changes THEN should return true") {
      val sameRowAtDifferentKey = row.copy(key = key + "DIFF")
      table.hasRowChanged(sameRowAtDifferentKey) should equal(true)
    }

    Scenario("WHEN row hasn't changed at a given key THEN should return true") {
      table.hasRowChanged(row.copy()) should equal(false)
    }
  }

}
