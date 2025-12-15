package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.module.basket.BasketModule.BasketTradingConstituentColumnNames.InstanceIdRic
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{EditTableRpcHandler, RpcFunctionResult, RpcFunctionSuccess, RpcParams}
import org.finos.vuu.viewport.*

class BasketTradingConstituentService(val table: DataTable)(using tableContainer: TableContainer) extends EditTableRpcHandler with StrictLogging {
  override def editCell(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val columnName: String = params.namedParams("column").asInstanceOf[String]
    val data: Any = params.namedParams("data")
    val table = params.viewPort.table.asTable
    table.processUpdate(key, RowWithData(key, Map(InstanceIdRic -> key, columnName -> data)))
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
    RpcFunctionSuccess(None)
  }

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

  override def deleteRow(params: RpcParams): RpcFunctionResult = ???

  override def deleteCell(params: RpcParams): RpcFunctionResult = ???

  override def addRow(params: RpcParams): RpcFunctionResult = ???

  override def closeForm(params: RpcParams): RpcFunctionResult = ???
}
