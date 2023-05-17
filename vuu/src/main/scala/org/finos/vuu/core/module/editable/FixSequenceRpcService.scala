package org.finos.vuu.core.module.editable

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{EditRpcHandler, RpcHandler}
import org.finos.vuu.viewport.{CloseDialogViewPortAction, ViewPort, ViewPortAction, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortDeleteRowAction, ViewPortEditAction, ViewPortEditCellAction, ViewPortEditFailure, ViewPortEditRowAction, ViewPortEditSuccess, ViewPortFormCloseAction, ViewPortFormSubmitAction}

class FixSequenceRpcService(implicit clock: Clock) extends RpcHandler with EditRpcHandler{

  def onDeleteRow(key: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  def onDeleteCell(key: String, column: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  def onAddRow(key: String, data: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  private def onEditCell(key: String, columnName: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val table = vp.table.asTable
    table.processUpdate(key, RowWithData(key, Map(columnName -> data)), clock.now())
    ViewPortEditSuccess()
  }

  private def onEditRow(key: String, row: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val table = vp.table.asTable
    table.processUpdate(key, RowWithData(key, row), clock.now())
    ViewPortEditSuccess()
  }

  private def onFormSubmit(vp: ViewPort, session: ClientSessionId): ViewPortAction = {
    val table = vp.table.asTable
    val primaryKeys = table.primaryKeys
    val headKey = primaryKeys.head
    val sequencerNumber = table.pullRow(headKey).get("sequenceNumber").asInstanceOf[Long]

    if (sequencerNumber > 0) {
      logger.info("I would now send this fix seq to a fix engine to reset, we're all good:" + sequencerNumber)
      CloseDialogViewPortAction(vp.id)
    } else {
      logger.error("Seq number not set, returning error")
      ViewPortEditFailure("Sequencer number has not been set.")
    }
  }

  private def onFormClose(vp: ViewPort, session: ClientSessionId): ViewPortAction = {
    CloseDialogViewPortAction(vp.id)
  }

  override def deleteRowAction(): ViewPortDeleteRowAction = ViewPortDeleteRowAction("", this.onDeleteRow)
  override def deleteCellAction(): ViewPortDeleteCellAction = ViewPortDeleteCellAction("", this.onDeleteCell)
  override def addRowAction(): ViewPortAddRowAction = ViewPortAddRowAction("", this.onAddRow)
  override def editCellAction(): ViewPortEditCellAction = ViewPortEditCellAction("", this.onEditCell)
  override def editRowAction(): ViewPortEditRowAction = ViewPortEditRowAction("", this.onEditRow)
  override def onFormSubmit(): ViewPortFormSubmitAction = ViewPortFormSubmitAction("", this.onFormSubmit)
  override def onFormClose(): ViewPortFormCloseAction = ViewPortFormCloseAction("", this.onFormClose)
}
