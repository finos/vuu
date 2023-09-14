package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper._
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.{DefaultRange, ViewPortContainer}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DataTableTest extends AnyFeatureSpec with Matchers {

  implicit val timeProvider: Clock = new DefaultClock

  Feature("Test data table functionality"){

    Scenario("When we tick a value through our mock provider, check it arrives in our listener"){

      implicit val lifecycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl

      val joinProvider   = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()

      val providerContainer = new ProviderContainer(joinProvider)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val table = new SimpleDataTable(pricesDef, joinProvider)

      val provider = new MockProvider(table)

      val session = ClientSessionId("sess-01", "chris")

      val vpcolumns = List("ric", "bid", "ask")

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, table, DefaultRange, ViewPortColumnCreator.create(table, vpcolumns))

      provider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))

      table.primaryKeys.length should equal (1)

      viewPortContainer.runOnce()

      val viewPortUpdate = combineQs(viewPort)

      viewPortUpdate(1).key.key should equal( "VOD.L")
    }
  }

}
