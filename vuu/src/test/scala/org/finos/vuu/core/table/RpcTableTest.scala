package org.finos.vuu.core.table

import org.finos.vuu.api.TableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper._
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.{JoinTableProviderImpl, ProviderContainer, RpcProvider}
import org.finos.vuu.viewport.{DefaultRange, ViewPortContainer}
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.DefaultClock
import org.scalatest.OneInstancePerTest
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RpcTableTest extends AnyFeatureSpec with Matchers with OneInstancePerTest {

  Feature("Check we can create rpc tables and tick them") {

    Scenario("simple rpc table") {

      //val sessionTable = new GroupBySessionTable(null, null)

      //println(sessionTable.isInstanceOf[SessionTable])

      implicit val time: DefaultClock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

      val joinProvider   = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val (outQueue, highPriorityQueue) = getQueues
      //val highPriorityQueue = new OutboundRowPublishQueue()

      val providerContainer = new ProviderContainer(joinProvider)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

      val orderEntryDef = TableDef("orderEntry", "clOrderId", Columns.fromNames("clOrderId:String", "ric:String", "quantity: Double", "orderType:String", "price: Double", "priceLevel: String"), "ric")

      val canons = orderEntryDef.columns.map( c => c.dataType.getCanonicalName )

      val typeNames = orderEntryDef.columns.map( c => c.dataType.getTypeName )

      val orderEntry = new SimpleDataTable(orderEntryDef, joinProvider)

      val provider = new RpcProvider(orderEntry)

      val session = new ClientSessionId("sess-01", "chris")

      val vpcolumns = ViewPortColumnCreator.create(orderEntry, List("clOrderId", "ric", "quantity", "orderType", "price", "priceLevel"))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orderEntry, DefaultRange, vpcolumns)

      provider.tick("CLORDID-1", Map("clOrderId" ->  "CLORDID-1", "ric" -> "VOD.L", "quantity" -> 200))

      orderEntry.primaryKeys.length should equal (1)

      viewPortContainer.runOnce()

      val viewPortUpdate = combineQs(viewPort)

      viewPortUpdate(1).key.key should equal("CLORDID-1")
    }

  }

}
