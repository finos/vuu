package org.finos.vuu.viewport.sessiontable

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.{combineQs, emptyQueues}
import org.finos.vuu.core.table.{RowWithData, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{EditRpcHandler, RpcHandler}
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport._
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class EditSessionTableTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen with AbstractSessionTestCase {

  final implicit val clock: Clock = new TestFriendlyClock(TEST_TIME)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  /**
   * This is the process rpc service.
   */
  class ProcessRpcService(tableContainer: TableContainer, clock: Clock) extends RpcHandler {

    final val FIX_SEQ_RESET_TABLE = "fixSequenceReset"

    private def openEditSeqNum(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {

      val baseTable = tableContainer.getTable(FIX_SEQ_RESET_TABLE)

      val sessionTable = tableContainer.createSimpleSessionTable(baseTable, session)

      val row = selection.rowKeyIndex.keys.map(selection.viewPort.table.pullRow(_)).toList.head

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
  class FixSequenceNumberResetService(implicit clock: Clock) extends RpcHandler with EditRpcHandler {

    private def onEditCell(key: String, columnName: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
      val table = vp.table.asTable
      table.processUpdate(key, RowWithData(key, Map(columnName -> data)))
      ViewPortEditSuccess()
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

      if(sequencerNumber > 0){
        logger.debug("I would now send this fix seq to a fix engine to reset, we're all good:" + sequencerNumber)
        CloseDialogViewPortAction(vp.id)
      }else{
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
    override def deleteRowAction(): ViewPortDeleteRowAction = ViewPortDeleteRowAction("", (x,y,z) => ViewPortEditSuccess())
    override def deleteCellAction(): ViewPortDeleteCellAction = ViewPortDeleteCellAction("", (a,b,c,d) => ViewPortEditSuccess())
    override def addRowAction(): ViewPortAddRowAction = ViewPortAddRowAction("", (a,b,c,d) => ViewPortEditSuccess())
    override def onFormClose(): ViewPortFormCloseAction = ViewPortFormCloseAction("", this.onFormClose)
  }

  Feature("Test full flow through editable session table") {

    Scenario("Create a session table based on a user action and populate it with callbacks") {

      val (viewPortContainer, process, processProvider, session, outQueue, fixSequence, tableContainer) = setupEditableSessionTableInfra()

      Given("We create a viewport on the process table (view only)")
      val vpcolumns = ViewPortColumnCreator.create(process, process.getTableDef.columns.map(_.name).toList)

      Given("We define a viewport callback on process with an rpc service attached...")
      viewPortContainer.addViewPortDefinition(process.getTableDef.name, createViewPortDefFunc(tableContainer, new ProcessRpcService(tableContainer, clock), clock))

      viewPortContainer.addViewPortDefinition(fixSequence.getTableDef.name, createViewPortDefFunc(tableContainer, new FixSequenceNumberResetService(), clock))

      And("we've ticked in some data")
      processProvider.tick("proc-1", Map("id" -> "proc-1", "name" -> "My Process 1", "uptime" -> 5000L, "status" -> "running"))
      processProvider.tick("proc-2", Map("id" -> "proc-2", "name" -> "My Process 2", "uptime" -> 5000L, "status" -> "running"))

      Then("we create a viewport...")
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, process, DefaultRange, vpcolumns)

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
      val sessionColumns = ViewPortColumnCreator.create(sessionTable, sessionTable.getTableDef.columns.map(_.name).toList)

      val sessionViewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, sessionTable, DefaultRange, sessionColumns)

      viewPortContainer.runOnce()

      Then("verify the table is populated")
      assertVpEq(combineQs(sessionViewPort)) {
        Table(
          ("process-id", "sequenceNumber"),
          ("proc-1"  ,0         )
        )
      }

      viewPortContainer.callRpcEditCell(sessionViewPort.id, "proc-1", "sequenceNumber", Long.box(100001L), session)

      viewPortContainer.runOnce()

      Then("verify the table is populated")
      assertVpEq(combineQs(sessionViewPort)) {
        Table(
          ("process-id","sequenceNumber"),
          ("proc-1"  ,100001L   )
        )
      }

      val actionClose = viewPortContainer.callRpcFormSubmit(sessionViewPort.id, session)

      actionClose.getClass should equal(classOf[CloseDialogViewPortAction])
    }
  }
}