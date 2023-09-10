package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.{DefaultRange, ViewPortContainer}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class BasketTableTest extends AnyFeatureSpec with Matchers {


  implicit val timeProvider: Clock = new DefaultClock

  Feature("Create Basket Table") {
    implicit val lifecycle = new LifecycleContainer
    implicit val metrics = new MetricsProviderImpl

    val joinProvider = JoinTableProviderImpl()
    val constituentJoinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

    Scenario("When we tick a value through our mock provider, check it arrives in our listener") {

      val basketDef = TableDef("baskets", "name", Columns.fromNames("name:String"), "name")
      val basketConstituentDef = TableDef("rics", "ric", Columns.fromNames("ric:String"), "ric")

      val constituentTable = new BasketConstituentTable(basketConstituentDef, constituentJoinProvider)
      val table = new BasketTable(basketDef, joinProvider)
      table.setConstituentTable(constituentTable)

      val provider = new MockProvider(table)
      val constituentProvider = new MockProvider(constituentTable)

      val session = ClientSessionId("sess-01", "chris")

      val vpcolumns = List("name")

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, table, DefaultRange, ViewPortColumnCreator.create(table, vpcolumns))

      provider.tick("Basket1", Map("name" -> "Basket1"))
      constituentProvider.tick("AAL.L", Map("ric" -> "AAL.L"))
      table.primaryKeys.length should equal(1)

      viewPortContainer.runOnce()

      val viewPortUpdate = combineQs(viewPort)

      viewPortUpdate(1).key.key should equal("Basket1")
      val basketTable = viewPortUpdate(1).table.asInstanceOf[BasketTable]
      basketTable.basketConstituentTable.primaryKeys.last should equal("AAL.L")
    }
  }

}
