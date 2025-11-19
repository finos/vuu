package org.finos.vuu.core.module.editable

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{DefaultRpcHandler, EditRpcHandler}
import org.finos.vuu.viewport._

class FixSequenceRpcService(implicit clock: Clock, tableContainer: TableContainer) extends DefaultRpcHandler with EditRpcHandler {

  def onDeleteCell(key: String, column: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  def onAddRow(key: String, data: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

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
    val sequencerNumber = table.pullRow(headKey).get("sequenceNumber").asInstanceOf[Int].toLong

    if (sequencerNumber > 0) {
      logger.trace("I would now send this fix seq to a fix engine to reset, we're all good:" + sequencerNumber)
      CloseDialogViewPortAction(vp.id)
    } else {
      logger.error("Seq number not set, returning error")
      ViewPortEditFailure("Sequencer number has not been set.")
    }
  }

  private def onFormClose(vp: ViewPort, session: ClientSessionId): ViewPortAction = {
    CloseDialogViewPortAction(vp.id)
  }

  override def deleteCellAction(): ViewPortDeleteCellAction = ViewPortDeleteCellAction("", this.onDeleteCell)

  override def addRowAction(): ViewPortAddRowAction = ViewPortAddRowAction("", this.onAddRow)

  override def editCellAction(): ViewPortEditCellAction = ViewPortEditCellAction("", this.onEditCell)

  override def editRowAction(): ViewPortEditRowAction = ViewPortEditRowAction("", this.onEditRow)

  override def onFormSubmit(): ViewPortFormSubmitAction = ViewPortFormSubmitAction("", this.onFormSubmit)

  override def onFormClose(): ViewPortFormCloseAction = ViewPortFormCloseAction("", this.onFormClose)
}
