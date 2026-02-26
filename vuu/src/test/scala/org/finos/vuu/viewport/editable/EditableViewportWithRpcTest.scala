package org.finos.vuu.viewport.editable

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.*
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.net.rpc.{EditTableRpcHandler, RpcFunctionFailure, RpcFunctionResult, RpcFunctionSuccess, RpcNames, RpcParams}
import org.finos.vuu.net.RequestContext
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.*
import org.scalatest.prop.Tables.Table

class ConstituentInstrumentPricesRpcService()(using tableContainer: TableContainer) extends EditTableRpcHandler {
  registerRpc("sendToMarket", params => sendToMarket(params))

  override def editCell(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val column: String = params.namedParams("column").asInstanceOf[String]
    val data: Any = params.namedParams("data")
    val joinTable = params.viewPort.table.asTable.asInstanceOf[JoinTable]
    val baseTableDef = joinTable.getTableDef.baseTable
    joinTable.sourceTables.get(baseTableDef.name) match {
      case Some(table: DataTable) =>
        table.processUpdate(key, RowWithData(key, Map("id" -> key, column -> data)))
        RpcFunctionSuccess(None)
      case None =>
        RpcFunctionFailure(0, "Could not find base table", null)
    }
  }

  def sendToMarket(params: RpcParams): RpcFunctionResult = {
    logger.trace("Calling sendToMarket()")
    RpcFunctionSuccess(None)
  }

  override def editRow(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val data: Map[String, Any] = params.namedParams("data").asInstanceOf[Map[String, Any]]
    val table = params.viewPort.table.asTable
    table.processUpdate(key, RowWithData(key, data))
    RpcFunctionSuccess(None)
  }

  override def submitForm(params: RpcParams): RpcFunctionResult = {
    val table = params.viewPort.table.asTable
    val primaryKeys = table.primaryKeys
    val headKey = primaryKeys.head
    val sequencerNumber = table.pullRow(headKey).get("sequenceNumber").asInstanceOf[Long]

    if (sequencerNumber > 0) {
      logger.debug("I would now send this fix seq to a fix engine to reset, we're all good:" + sequencerNumber)
      RpcFunctionSuccess(None)
    } else {
      logger.error("Seq number not set, returning error")
      RpcFunctionFailure(0, "Sequencer number has not been set.", null)
    }
  }

  override def deleteRow(params: RpcParams): RpcFunctionResult = ???

  override def deleteCell(params: RpcParams): RpcFunctionResult = ???

  override def addRow(params: RpcParams): RpcFunctionResult = ???

  override def closeForm(params: RpcParams): RpcFunctionResult = ???
}

class EditableViewportWithRpcTest extends EditableViewPortTest {

  Feature("Test full flow through editable session table") {

    Scenario("Create a session table based on a user action and populate it with callbacks") {

      implicit val clock: Clock = new TestFriendlyClock(TEST_TIME)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (viewPortContainer, tablesAndProviders, user, session, outQueue, tableContainer, joinTableManager) = setupEditableTableInfra()
      val context = RequestContext("AAA", user, session, outQueue)

      val (constituent, consProvider) = tablesAndProviders("constituent")
      val (instrument, instrumentProvider) = tablesAndProviders("instrument")
      val (prices, pricesProvider) = tablesAndProviders("price")
      val (consInstPrice, _) = tablesAndProviders("consInstrumentPrice")

      Given("We define a viewport callback on process with an rpc service attached...")
      viewPortContainer.addViewPortDefinition(consInstPrice.getTableDef.name, createViewPortDefFunc(tableContainer, new ConstituentInstrumentPricesRpcService()(using tableContainer), clock))

      And("we've ticked in some data")
      consProvider.tick("bskt1.vod.l", Map("id" -> "bskt1.vod.l", "ric" -> "VOD.L", "quantity" -> 1000L))
      consProvider.tick("bskt1.bt.l", Map("id" -> "bskt1.bt.l", "ric" -> "BT.L", "quantity" -> 500L))

      instrumentProvider.tick("VOD.L", Map("ric" -> "VOD.L", "description" -> "Vodafone"))
      instrumentProvider.tick("BT.L", Map("ric" -> "BT.L", "description" -> "British Telecom"))

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 123L, "ask" -> 124L))
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 223L, "ask" -> 224L))

      joinTableManager.runOnce()

      Given("We create a viewport on the consInstPrice table (view only)")
      val vpColumns = ViewPortColumnCreator.create(consInstPrice)
      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, consInstPrice, DefaultRange, vpColumns)

      joinTableManager.runOnce()
      viewPortContainer.runOnce()

      Then("we can expect the result of the join...")
      assertVpEq(combineQs(viewPort)) {
        Table(
          ("id", "ric", "quantity", "description", "bid", "ask"),
          ("bskt1.bt.l", "BT.L", 500L, "British Telecom", 223L, 224L),
          ("bskt1.vod.l", "VOD.L", 1000L, "Vodafone", 123L, 124L)
        )
      }

      Then("we call and edit rpc call")
      viewPortContainer.handleRpcRequest(viewPort.id, RpcNames.EditCellRpc, Map("key" -> "bskt1.vod.l", "column" -> "quantity", "data" -> Long.box(2000L)))(RequestContext(RequestId.oneNew(), user, session, outQueue))
      viewPortContainer.handleRpcRequest(viewPort.id, RpcNames.EditCellRpc, Map("key" -> "bskt1.bt.l", "column" -> "quantity", "data" -> Long.box(600L)))(RequestContext(RequestId.oneNew(), user, session, outQueue))

      joinTableManager.runOnce()
      viewPortContainer.runOnce()

      And("we can see the result of the rpc on the join table")
      val updates = combineQs(viewPort)
      assertVpEq(updates) {
        Table(
          ("id", "ric", "quantity", "description", "bid", "ask"),
          ("bskt1.bt.l", "BT.L", 600L, "British Telecom", 223L, 224L),
          ("bskt1.vod.l", "VOD.L", 2000L, "Vodafone", 123L, 124L)
        )
      }

      When("we call a viewport specific rpc call (sendToMarket)")
      val rpcResult = viewPort.getStructure.viewPortDef.service.processRpcRequest("sendToMarket", new RpcParams(Map(), viewPort, context))
      rpcResult.isInstanceOf[RpcFunctionSuccess] shouldBe true
    }
  }
}
