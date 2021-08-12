package io.venuu.vuu.viewport.menurpc

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, TestFriendlyClock}
import io.venuu.vuu.api.{TableDef, ViewPortDef, VisualLinks}
import io.venuu.vuu.core.module.ModuleFactory.stringToString
import io.venuu.vuu.core.table.{Columns, DataTable, TableContainer}
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider, Provider}
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.util.table.TableAsserts.assertVpEq
import io.venuu.vuu.viewport._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import scala.util.{Failure, Success, Try}

class CallMenuRpcFromViewPortTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

  implicit val timeProvider: Clock = new TestFriendlyClock(1311544800)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  def setupViewPort(tableContainer: TableContainer) = {

    val viewPortContainer = new ViewPortContainer(tableContainer)

    viewPortContainer
  }

  def createRpcHandler(mockProvider: MockProvider): RpcHandler = {
    new RpcHandler {
      def testSelect(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
        println("In testSelect" + selection.map.mkString(","))
        NoAction
      }

      def testCell(rowKey: String, field: String, value: Object, sessionId: ClientSessionId): ViewPortAction = {
        println("In testCell")
        NoAction
      }

      def testTable(sessionId: ClientSessionId): ViewPortAction = {
        println("In testTable")
        NoAction
      }

      def testRow(rowKey: String, row: Map[String, Any], sessionId: ClientSessionId): ViewPortAction = {
        println("In testRow")
        NoAction
      }

      override def menuItems(): ViewPortMenu = ViewPortMenu("Test Menu",
        new SelectionViewPortMenuItem("Test Selection", "", this.testSelect, "TEST_SELECT"),
        new CellViewPortMenuItem("Test Cell", "", this.testCell, "TEST_CELL"),
        new TableViewPortMenuItem("Test Table", "", this.testTable, "TEST_TABLE"),
        new RowViewPortMenuItem("Test Row", "", this.testRow, "TEST_ROW")
      )
    }
  }

  def createInstrumentsRpc() = {

    implicit val lifecycle = new LifecycleContainer

    val instrumentsDef = TableDef(
      name = "instruments",
      keyField = "ric",
      columns = Columns.fromNames("ric".string(), "description".string(), "bbg".string(), "isin".string(), "currency".string(), "exchange".string(), "lotSize".int()),
      VisualLinks(),
      joinFields = "ric"
    )

    val joinProvider   = new JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val instruments = tableContainer.createTable(instrumentsDef)

    val instrumentsProvider = new MockProvider(instruments)

    val viewPortContainer = setupViewPort(tableContainer)

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    (viewPortContainer, instruments, instrumentsProvider, session, outQueue, highPriorityQueue)
  }

  def createViewPortDef(): (DataTable, Provider) => ViewPortDef = {
    val func = (t: DataTable, provider: Provider) => ViewPortDef(t.getTableDef.columns, createRpcHandler(provider.asInstanceOf[MockProvider]))
    func
  }

  Feature("Viewport defined RPC functions") {

    Scenario("Invoke a viewport related rpc function") {

      val (vpContainer, instruments, instrumentsProvider, session, outQueue, highPriorityQueue) =  createInstrumentsRpc()

      vpContainer.addViewPortDefinition(instruments.getTableDef.name, createViewPortDef())

      val viewPort = vpContainer.create(session, outQueue, highPriorityQueue, instruments, DefaultRange, instruments.getTableDef.columns.toList)

      instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "description" -> "Vodafone", "bbg" -> "VOD LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))
      instrumentsProvider.tick("BT.L", Map("ric" -> "BT.L", "description" -> "British Telecom", "bbg" -> "BT LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))

      vpContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEq(combinedUpdates){
        Table(
          ("ric"     ,"description","bbg"     ,"currency","exchange", "lotSize", "isin"),
          ("VOD.L"   ,"Vodafone","VOD LN"  ,"GBp"     ,"XLON/SETS", null, null),
          ("BT.L"    ,"British Telecom","BT LN"   ,"GBp"     ,"XLON/SETS", null, null)
        )
      }

      vpContainer.changeSelection(session, outQueue, viewPort.id, ViewPortSelectedIndices(Array(0)))

      val result = vpContainer.callRpc(viewPort.id, "TEST_SELECT", session)

      result shouldEqual NoAction

      Try(vpContainer.callRpc(viewPort.id, "FOO_BAR", session)) match {
        case Success(_) =>
          assert(true == false, "I should never get here, it should be an exception")
        case Failure(e) =>
          println("Failed call, as expected:[" + e.getMessage + "]")
          assert(true == true, "this is all good")
      }
    }
  }
}
