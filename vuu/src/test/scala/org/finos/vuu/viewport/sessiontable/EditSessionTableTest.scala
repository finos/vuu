package org.finos.vuu.viewport.sessiontable

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.TableTestHelper.{combineQs, emptyQueues}
import org.finos.vuu.core.table.{RowWithData, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.rpc.*
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.*
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.util.concurrent.atomic.AtomicInteger

class EditSessionTableTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen with AbstractSessionTestCase {

  final implicit val clock: Clock = new TestFriendlyClock(TEST_TIME)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  /**
   * This is the process rpc service, triggered by a menu item RPC call
   */
  class ProcessRpcService(tableContainer: TableContainer, clock: Clock) extends RpcHandler {
    final val FIX_SEQ_RESET_TABLE = "fixSequenceReset"

    private def openEditSeqNum(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {

      val baseTable = tableContainer.getTable(FIX_SEQ_RESET_TABLE)

      val sessionTable = tableContainer.createSimpleSessionTable(baseTable, session)

      val row = selection.selectionKeys.map(selection.viewPort.table.pullRow(_)).toList.head

      val processId = row.get("id").toString

      sessionTable.processUpdate(processId, RowWithData(processId, Map("process-id" -> processId, "sequenceNumber" -> 0)))

      OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), RenderComponent.InlineForm)
    }

    override def menuItems(): ViewPortMenu = ViewPortMenu("Admin",
      new SelectionViewPortMenuItem("Reset SeqNum", "", this.openEditSeqNum, "OPEN_EDIT_RESET_FIX")
    )
  }

  /**
   * This class represents the editing of the fixSequenceReset
   */
  class FixSequenceNumberResetService()(using tableContainer: TableContainer) extends EditTableRpcHandler {

    override def editCell(params: RpcParams): RpcFunctionResult = {
      val key: String = params.namedParams("key").asInstanceOf[String]
      val column: String = params.namedParams("column").asInstanceOf[String]
      val data: Any = params.namedParams("data")
      val table = params.viewPort.table.asTable
      table.processUpdate(key, RowWithData(key, Map(column -> data)))
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

  /**
   * This is the callback to create a session table, triggered by a generic RPC call
   */

  private class StopProcessDialogueService(implicit tableContainer: TableContainer) extends DefaultRpcHandler {

    registerRpc("OPEN_STOP_PROCESS", params => openStopProcessDialogue(tableContainer, params))

    private def openStopProcessDialogue(tableContainer: TableContainer, params: RpcParams): RpcFunctionResult = {
      val baseTable = tableContainer.getTable("stopProcess")

      val sessionTable = tableContainer.createSimpleSessionTable(baseTable, params.ctx.session)

      params.viewPort.getSelection.foreach(f => {
        val rowWithData = params.viewPort.table.pullRow(f)
        sessionTable.processUpdate(f, RowWithData(f, Map("process-id" -> f, "status" -> rowWithData.get("status"))))
      })

      RpcFunctionSuccess(Some(OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), RenderComponent.InlineForm)))
    }

  }

  private class StopProcessService()(using tableContainer: TableContainer) extends EditTableRpcHandler {

    val count = new AtomicInteger(0)

    override def deleteRow(params: RpcParams): RpcFunctionResult = {
      val key: String = params.namedParams("key").asInstanceOf[String]
      val vp: ViewPort = params.viewPort

      vp.table.asTable.processDelete(key)
      RpcFunctionSuccess(None)
    }

    override def submitForm(params: RpcParams): RpcFunctionResult = {
      val vp: ViewPort = params.viewPort
      vp.getKeys.foreach(f => {
        logger.info("Stopping {}", f)
        count.incrementAndGet()
      })
      RpcFunctionSuccess(None)
    }

    override def deleteCell(params: RpcParams): RpcFunctionResult = ???

    override def addRow(params: RpcParams): RpcFunctionResult = ???

    override def editRow(params: RpcParams): RpcFunctionResult = ???

    override def editCell(params: RpcParams): RpcFunctionResult = ???

    override def closeForm(params: RpcParams): RpcFunctionResult = ???
  }

  Feature("Test full flow through editable session table") {

    Scenario("Create a session table based on a menu item user action and populate it with callbacks") {

      val (viewPortContainer, process, processProvider, user, session, outQueue, fixSequence, tableContainer, _) = setupEditableSessionTableInfra()

      Given("We create a viewport on the process table (view only)")
      val vpcolumns = ViewPortColumnCreator.create(process)

      Given("We define a viewport callback on process with an rpc service attached...")
      viewPortContainer.addViewPortDefinition(process.getTableDef.name, createViewPortDefFunc(tableContainer, new ProcessRpcService(tableContainer, clock), clock))

      viewPortContainer.addViewPortDefinition(fixSequence.getTableDef.name, createViewPortDefFunc(tableContainer, new FixSequenceNumberResetService()(using tableContainer), clock))

      And("we've ticked in some data")
      processProvider.tick("proc-1", Map("id" -> "proc-1", "name" -> "My Process 1", "uptime" -> 5000L, "status" -> "running"))
      processProvider.tick("proc-2", Map("id" -> "proc-2", "name" -> "My Process 2", "uptime" -> 5000L, "status" -> "running"))

      Then("we create a viewport...")
      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, process, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      And("change the selection, so we have first row selected")
      viewPortContainer.selectRow(viewPort.id, "proc-1", preserveExistingSelection = false)

      Then("call rpc call to create session table, this should create an OpenDialogViewPortAction")
      val action = viewPortContainer.callRpcSelection(viewPort.id, "OPEN_EDIT_RESET_FIX", session).asInstanceOf[OpenDialogViewPortAction]

      action.renderComponent should equal("inline-form")
      action.table.table should startWith("session:")
      action.table.module should equal("TEST")

      emptyQueues(viewPort)

      Then("At this point the UI will create a viewport on the new table")
      val sessionTable = tableContainer.getTable(action.table.table)
      val sessionColumns = ViewPortColumnCreator.create(sessionTable)

      val sessionViewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, sessionTable, DefaultRange, sessionColumns)

      viewPortContainer.runOnce()

      Then("verify the table is populated")
      assertVpEq(combineQs(sessionViewPort)) {
        Table(
          ("process-id", "sequenceNumber"),
          ("proc-1", 0)
        )
      }

      viewPortContainer.handleRpcRequest(sessionViewPort.id, RpcNames.EditCellRpc, Map("key" -> "proc-1", "column" -> "sequenceNumber", "data" -> Long.box(100001L)))(RequestContext(RequestId.oneNew(), user, session, outQueue))

      viewPortContainer.runOnce()

      Then("verify the table is populated")
      assertVpEq(combineQs(sessionViewPort)) {
        Table(
          ("process-id", "sequenceNumber"),
          ("proc-1", 100001L)
        )
      }

      val submitFormResult = viewPortContainer.handleRpcRequest(sessionViewPort.id, RpcNames.SubmitFormRpc, Map.empty)(RequestContext(RequestId.oneNew(), user, session, outQueue))
      submitFormResult.isInstanceOf[RpcFunctionSuccess] shouldBe true
    }

    Scenario("Create a session table based on a generic rpc call and populate it with callbacks") {

      val (viewPortContainer, process, processProvider, user, session, outQueue, _, tableContainer, stopProcess) = setupEditableSessionTableInfra()

      Given("We create a viewport on the process table (view only)")
      val vpcolumns = ViewPortColumnCreator.create(process)

      Given("We define a viewport callback on process with an rpc service attached...")
      viewPortContainer.addViewPortDefinition(process.getTableDef.name, createViewPortDefFunc(tableContainer,
        new StopProcessDialogueService()(tableContainer), clock))
      val stopProcessService = new StopProcessService()(using tableContainer)
      viewPortContainer.addViewPortDefinition(stopProcess.getTableDef.name, createViewPortDefFunc(tableContainer,
        stopProcessService, clock))

      And("we've ticked in some data")
      processProvider.tick("proc-1", Map("id" -> "proc-1", "name" -> "My Process 1", "uptime" -> 5000L, "status" -> "running"))
      processProvider.tick("proc-2", Map("id" -> "proc-2", "name" -> "My Process 2", "uptime" -> 5000L, "status" -> "running"))
      processProvider.tick("proc-3", Map("id" -> "proc-3", "name" -> "My Process 3", "uptime" -> 5000L, "status" -> "running"))

      Then("we create a viewport...")
      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, process, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      And("select all the rows")
      viewPortContainer.selectAll(viewPort.id)

      Then("call rpc call to create session table, this should create an OpenDialogViewPortAction")
      val response = viewPortContainer.handleRpcRequest(viewPort.id, "OPEN_STOP_PROCESS", Map.empty)(RequestContext(RequestId.oneNew(), user, session, outQueue)).asInstanceOf[RpcFunctionSuccess]

      val action = response.optionalResult.get.asInstanceOf[OpenDialogViewPortAction]
      action.renderComponent should equal("inline-form")
      action.table.table should startWith("session:")
      action.table.module should equal("TEST")

      emptyQueues(viewPort)

      Then("At this point the UI will create a viewport on the new table")
      val sessionTable = tableContainer.getTable(action.table.table)
      val sessionColumns = ViewPortColumnCreator.create(sessionTable)

      val sessionViewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, sessionTable, DefaultRange, sessionColumns)

      viewPortContainer.runOnce()

      Then("verify the table is populated")
      assertVpEq(combineQs(sessionViewPort)) {
        Table(
          ("process-id", "status"),
          ("proc-1", "running"),
          ("proc-2", "running"),
          ("proc-3", "running"),
        )
      }

      Then("Remove a row from the dialogue")
      val deleteRowResult = viewPortContainer.handleRpcRequest(sessionViewPort.id, RpcNames.DeleteRowRpc, Map("key" -> "proc-2"))(RequestContext(RequestId.oneNew(), user, session, outQueue))
      deleteRowResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

      viewPortContainer.runOnce()

      Then("Submit the form")
      val submitFormResult = viewPortContainer.handleRpcRequest(sessionViewPort.id, RpcNames.SubmitFormRpc, Map.empty)(RequestContext(RequestId.oneNew(), user, session, outQueue))
      submitFormResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

      Then("check we called stop twice")
      assert(stopProcessService.count.get() == 2)
    }
  }
}
