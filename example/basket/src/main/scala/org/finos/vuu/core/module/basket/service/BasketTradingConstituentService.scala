package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule.BasketTradingConstituentColumnNames.InstanceIdRic
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{DefaultRpcHandler, EditRpcHandler, RpcHandler, RpcParams}
import org.finos.vuu.viewport._

// TODO: see comment on processViewPortRpcCall for why we extends DefaultRpcHandler with RpcHandler
class BasketTradingConstituentService(val table: DataTable)(implicit clock: Clock, val tableContainer: TableContainer) extends DefaultRpcHandler with RpcHandler with EditRpcHandler with StrictLogging {

  /**
   * We switched to DefaultRpcHandler instead of RpcHandler so that ViewportTypeAheadRpcHandler is enabled by default.
   * This class needs the processViewPortRpcCall from RpcHandler though.
   * Ideally we should switch to use DefaultRpcHandler.processViewPortRpcCall
   */
  override def processViewPortRpcCall(methodName: String, rpcParams: RpcParams): ViewPortAction = {
    super[RpcHandler].processViewPortRpcCall(methodName, rpcParams)
  }

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
    table.processUpdate(key, RowWithData(key, Map(InstanceIdRic -> key, columnName -> data)))
    ViewPortEditSuccess()
  }

  private def onEditRow(key: String, row: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val table = vp.table.asTable
    table.processUpdate(key, RowWithData(key, row))
    ViewPortEditSuccess()
  }

  private def onFormSubmit(vp: ViewPort, session: ClientSessionId): ViewPortAction = {
//    val table = vp.table.asTable
//    val primaryKeys = table.primaryKeys
//    val headKey = primaryKeys.head
//    val sequencerNumber = table.pullRow(headKey).get("sequenceNumber").asInstanceOf[Int].toLong
//
//    if (sequencerNumber > 0) {
//      logger.info("I would now send this fix seq to a fix engine to reset, we're all good:" + sequencerNumber)
//      CloseDialogViewPortAction(vp.id)
//    } else {
//      logger.error("Seq number not set, returning error")
//      ViewPortEditFailure("Sequencer number has not been set.")
//    }
    CloseDialogViewPortAction(vp.id)
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

  def setSell(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {
    ViewPortEditSuccess()
  }

  def setBuy(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {
    ViewPortEditSuccess()
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu("Direction",
    new SelectionViewPortMenuItem("Set Sell", "", this.setSell, "SET_SELECTION_SELL"),
    new SelectionViewPortMenuItem("Set Buy", "", this.setBuy, "SET_SELECTION_Buy")
  )
}
