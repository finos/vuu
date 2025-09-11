package org.finos.vuu.viewport.editable

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table._
import org.finos.vuu.net.rpc.{DefaultRpcHandler, EditRpcHandler, RpcFunctionResult, RpcFunctionSuccess, RpcParams}
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport._
import org.scalatest.prop.Tables.Table

class ConstituentInstrumentPricesRpcService()(implicit clock: Clock, val tableContainer: TableContainer) extends DefaultRpcHandler() with EditRpcHandler {
  registerRpc("sendToMarket", params => sendToMarket(params))

  private def onEditCell(key: String, columnName: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val joinTable = vp.table.asTable.asInstanceOf[JoinTable]
    val baseTableDef = joinTable.getTableDef.asInstanceOf[JoinTableDef].baseTable
    joinTable.sourceTables.get(baseTableDef.name) match {
      case Some(table: DataTable) =>
        table.processUpdate(key, RowWithData(key, Map("id" -> key, columnName -> data)))
        ViewPortEditSuccess()
      case None =>
        ViewPortEditFailure("Could not find base table")
    }
  }

  def sendToMarket(params: RpcParams): RpcFunctionResult = {
    logger.trace("Calling sendToMarket()")
    RpcFunctionSuccess(None)
  }

  private def onEditRow(key: String, row: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val table = vp.table.asTable
    table.processUpdate(key, RowWithData(key, row))
    ViewPortEditSuccess()
  }

  private def onFormSubmit(vp: ViewPort, session: ClientSessionId): ViewPortAction = {
    val table = vp.table.asTable
    val primaryKeys = table.primaryKeys
    val headKey = primaryKeys.head
    val sequencerNumber = table.pullRow(headKey).get("sequenceNumber").asInstanceOf[Long]

    if (sequencerNumber > 0) {
      logger.debug("I would now send this fix seq to a fix engine to reset, we're all good:" + sequencerNumber)
      CloseDialogViewPortAction(vp.id)
    } else {
      logger.error("Seq number not set, returning error")
      ViewPortEditFailure("Sequencer number has not been set.")
    }
  }

  private def onFormClose(vp: ViewPort, session: ClientSessionId): ViewPortAction = {
    CloseDialogViewPortAction(vp.id)
  }

  override def editCellAction(): ViewPortEditCellAction = ViewPortEditCellAction("", this.onEditCell)
  override def editRowAction(): ViewPortEditRowAction = ViewPortEditRowAction("", this.onEditRow)
  override def onFormSubmit(): ViewPortFormSubmitAction = ViewPortFormSubmitAction("", this.onFormSubmit)
  override def deleteRowAction(): ViewPortDeleteRowAction = ViewPortDeleteRowAction("", (x, y, z) => ViewPortEditSuccess())
  override def deleteCellAction(): ViewPortDeleteCellAction = ViewPortDeleteCellAction("", (a, b, c, d) => ViewPortEditSuccess())
  override def addRowAction(): ViewPortAddRowAction = ViewPortAddRowAction("", (a, b, c, d) => ViewPortEditSuccess())
  override def onFormClose(): ViewPortFormCloseAction = ViewPortFormCloseAction("", this.onFormClose)
}

class EditableViewportWithRpcTest extends EditableViewPortTest {

  Feature("Test full flow through editable session table") {

    Scenario("Create a session table based on a user action and populate it with callbacks") {

      implicit val clock: Clock = new TestFriendlyClock(TEST_TIME)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (viewPortContainer, tablesAndProviders, session, outQueue, tableContainer, joinTableManager) = setupEditableTableInfra()
      val context = RequestContext("AAA", session, outQueue, "AAABBBCC")

      val (constituent, consProvider) = tablesAndProviders("constituent")
      val (instrument, instrumentProvider) = tablesAndProviders("instrument")
      val (prices, pricesProvider) = tablesAndProviders("price")
      val (consInstPrice, _) = tablesAndProviders("consInstrumentPrice")

      Given("We define a viewport callback on process with an rpc service attached...")
      viewPortContainer.addViewPortDefinition(consInstPrice.getTableDef.name, createViewPortDefFunc(tableContainer, new ConstituentInstrumentPricesRpcService()(clock, tableContainer), clock))

      And("we've ticked in some data")
      consProvider.tick("bskt1.vod.l", Map("id" -> "bskt1.vod.l", "ric" -> "VOD.L", "quantity" -> 1000L))
      consProvider.tick("bskt1.bt.l", Map("id" -> "bskt1.bt.l", "ric" -> "BT.L", "quantity" -> 500L))

      instrumentProvider.tick("VOD.L", Map("ric" -> "VOD.L", "description" -> "Vodafone"))
      instrumentProvider.tick("BT.L", Map("ric" -> "BT.L", "description" -> "British Telecom"))

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L",  "bid" -> 123L, "ask" -> 124L))
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L",  "bid" -> 223L, "ask" -> 224L))

      joinTableManager.runOnce()

      Given("We create a viewport on the consInstPrice table (view only)")
      val vpColumns = ViewPortColumnCreator.create(consInstPrice, consInstPrice.getTableDef.columns.map(_.name).toList)
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, consInstPrice, DefaultRange, vpColumns)

      joinTableManager.runOnce()
      viewPortContainer.runOnce()

      Then("we can expect the result of the join...")
      assertVpEq(combineQs(viewPort)) {
        Table(
          ("id"      ,"ric"     ,"quantity","description","bid"     ,"ask"     ),
          ("bskt1.bt.l","BT.L"    ,500L      ,"British Telecom",223L      ,224L      ),
          ("bskt1.vod.l","VOD.L"   ,1000L     ,"Vodafone",123L      ,124L      )
        )
      }

      Then("we call and edit rpc call")
      viewPortContainer.callRpcEditCell(viewPort.id, "bskt1.vod.l", "quantity", Long.box(2000L), session)
      viewPortContainer.callRpcEditCell(viewPort.id, "bskt1.bt.l", "quantity", Long.box(600L), session)

      joinTableManager.runOnce()
      viewPortContainer.runOnce()

      And("we can see the result of the rpc on the join table")
      assertVpEq(combineQs(viewPort)) {
        Table(
          ("id"      ,"ric"     ,"quantity","description","bid"     ,"ask"     ),
          ("bskt1.bt.l","BT.L"    ,600L      ,"British Telecom",223L      ,224L      ),
          ("bskt1.vod.l","VOD.L"   ,2000L     ,"Vodafone",123L      ,124L      )
        )
      }

      When("we call a viewport specific rpc call (sendToMarket)")
      val rpcResult = viewPort.getStructure.viewPortDef.service.processRpcRequest("sendToMarket", new RpcParams(Map(), None, None, context))
      rpcResult.isInstanceOf[RpcFunctionSuccess] shouldBe true
    }
  }
}
