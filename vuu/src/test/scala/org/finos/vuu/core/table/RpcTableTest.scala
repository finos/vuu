package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.DefaultClock
import org.finos.vuu.api.TableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.TableTestHelper.*
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, ProviderContainer, RpcProvider}
import org.finos.vuu.viewport.{DefaultRange, ViewPortContainer}
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

      val (outQueue) = getQueues
      //val highPriorityQueue = new OutboundRowPublishQueue()

      val providerContainer = new ProviderContainer(joinProvider)
      val pluginRegistry = new DefaultPluginRegistry
      pluginRegistry.registerPlugin(new VuuInMemPlugin)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      val orderEntryDef = TableDef("orderEntry", "clOrderId", Columns.fromNames("clOrderId:String", "ric:String", "quantity: Double", "orderType:String", "price: Double", "priceLevel: String"), "ric")

      val canons = orderEntryDef.columns.map( c => c.dataType.getCanonicalName )

      val typeNames = orderEntryDef.columns.map( c => c.dataType.getTypeName )

      val orderEntry = new InMemDataTable(orderEntryDef, joinProvider)

      val provider = new RpcProvider(orderEntry)

      val user = VuuUser("chris")
      
      val session = ClientSessionId("sess-01", "channel")

      val vpcolumns = ViewPortColumnCreator.create(orderEntry, List("clOrderId", "ric", "quantity", "orderType", "price", "priceLevel"))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderEntry, DefaultRange, vpcolumns)

      provider.tick("CLORDID-1", Map("clOrderId" ->  "CLORDID-1", "ric" -> "VOD.L", "quantity" -> 200))

      orderEntry.primaryKeys.length should equal (1)

      viewPortContainer.runOnce()

      val viewPortUpdate = combineQs(viewPort)

      viewPortUpdate(0).key.key should equal("CLORDID-1")
    }

  }

}
