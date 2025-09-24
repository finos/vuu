package org.finos.vuu.viewport.menurpc

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.{TableDef, ViewPortDef, VisualLinks}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.{Columns, DataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, Provider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import scala.util.{Failure, Success, Try}

class CallMenuRpcFromViewPortTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

  implicit val timeProvider: Clock = new TestFriendlyClock(1311544800)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer): ViewPortContainer = {

    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

    viewPortContainer
  }

  def createRpcHandler(mockProvider: MockProvider): RpcHandler = {
    new RpcHandler {
      def testSelect(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
        println("In testSelect" + selection.selectionKeys.mkString(","))
        NoAction()
      }

      def testCell(rowKey: String, field: String, value: Object, sessionId: ClientSessionId): ViewPortAction = {
        println("In testCell")
        NoAction()
      }

      def testTable(sessionId: ClientSessionId): ViewPortAction = {
        println("In testTable")
        NoAction()
      }

      def testRow(rowKey: String, row: Map[String, Any], sessionId: ClientSessionId): ViewPortAction = {
        println("In testRow")
        NoAction()
      }

      override def menuItems(): ViewPortMenu = ViewPortMenu("Test Menu",
        new SelectionViewPortMenuItem("Test Selection", "", this.testSelect, "TEST_SELECT"),
        new CellViewPortMenuItem("Test Cell", "", this.testCell, "TEST_CELL"),
        new TableViewPortMenuItem("Test Table", "", this.testTable, "TEST_TABLE"),
        new RowViewPortMenuItem("Test Row", "", this.testRow, "TEST_ROW")
      )
    }
  }

  def createInstrumentsRpc(): (ViewPortContainer, DataTable, MockProvider, ClientSessionId, OutboundRowPublishQueue) = {

    implicit val lifecycle: LifecycleContainer = new LifecycleContainer

    val instrumentsDef = TableDef(
      name = "instruments",
      keyField = "ric",
      columns = Columns.fromNames("ric".string(), "description".string(), "bbg".string(), "isin".string(), "currency".string(), "exchange".string(), "lotSize".int()),
      VisualLinks(),
      joinFields = "ric"
    )

    val joinProvider   = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val instruments = tableContainer.createTable(instrumentsDef)

    val instrumentsProvider = new MockProvider(instruments)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    (viewPortContainer, instruments, instrumentsProvider, session, outQueue)
  }

  def createViewPortDef(): (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef = {
    val func = (t: DataTable, provider: Provider, pc: ProviderContainer, tableContainer: TableContainer) => ViewPortDef(t.getTableDef.columns, createRpcHandler(provider.asInstanceOf[MockProvider]))
    func
  }

  Feature("Viewport defined RPC functions") {

    Scenario("Invoke a viewport related rpc function") {

      val (vpContainer, instruments, instrumentsProvider, session, outQueue) = createInstrumentsRpc()

      vpContainer.addViewPortDefinition(instruments.getTableDef.name, createViewPortDef())

      val vpcolumnsOrders = ViewPortColumnCreator.create(instruments, instruments.getTableDef.columns.map(_.name).toList )

      val viewPort = vpContainer.create(RequestId.oneNew(), session, outQueue, instruments, DefaultRange, vpcolumnsOrders)

      instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "description" -> "Vodafone", "bbg" -> "VOD LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))
      instrumentsProvider.tick("BT.L", Map("ric" -> "BT.L", "description" -> "British Telecom", "bbg" -> "BT LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))

      vpContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEq(combinedUpdates){
        Table(
          ("ric", "description", "bbg", "currency", "exchange", "lotSize", "isin"),
          ("BT.L", "British Telecom", "BT LN", "GBp", "XLON/SETS", null, null),
          ("VOD.L", "Vodafone", "VOD LN", "GBp", "XLON/SETS", null, null)
        )
      }

      vpContainer.selectRow(viewPort.id, "BT.L", preserveExistingSelection = false)

      val result = vpContainer.callRpcSelection(viewPort.id, "TEST_SELECT", session)

      result.getClass shouldEqual classOf[NoAction]

      Try(vpContainer.callRpcSelection(viewPort.id, "FOO_BAR", session)) match {
        case Success(_) =>
          assert(false, "I should never get here, it should be an exception")
        case Failure(e) =>
          println("Failed call, as expected:[" + e.getMessage + "]")
          assert(true, "this is all good")
      }
    }
  }
}
