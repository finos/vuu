package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.basket.BasketConstants.Side
import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingConstituentTable}
import org.finos.vuu.core.table.{DataTable, RowData, RowWithData, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.rpc.{EditRpcHandler, RpcHandler}
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.order.oms.{CancelOrder, NewOrder, OmsApi}
import org.finos.vuu.viewport._

trait BasketTradingServiceIF extends EditRpcHandler {
  def sendToMarket(basketInstanceId: String)(ctx: RequestContext): ViewPortAction

  def takeOffMarket(basketInstanceId: String)(ctx: RequestContext): ViewPortAction
}


class BasketTradingService(val table: DataTable, val tableContainer: TableContainer, val omsApi: OmsApi)(implicit clock: Clock) extends RpcHandler with BasketTradingServiceIF with StrictLogging {

  import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingColumnNames => BT, BasketTradingConstituentColumnNames => BTC}


  /**
   * Send basket to market rpc call
   */
  override def sendToMarket(basketInstanceId: String)(ctx: RequestContext): ViewPortAction = {
    val tableRow = table.asTable.pullRow(basketInstanceId)

    logger.debug("Sending basket to market:" + basketInstanceId + " (row:" + tableRow + ")")

    val constituents = getConstituents(basketInstanceId)

    constituents.foreach(constituentRow => {

      val quantity = constituentRow.get(BTC.Quantity).asInstanceOf[Long]
      val symbol = constituentRow.get(BTC.Ric).toString
      val price = constituentRow.get(BTC.LimitPrice).asInstanceOf[Double]
      val instanceIdRic = constituentRow.get(BTC.InstanceIdRic).toString
      val side = constituentRow.get(BTC.Side).toString

      val nos = NewOrder(side, symbol, quantity, price, instanceIdRic)

      logger.debug(s"Sending constituent to market $nos")

      omsApi.createOrder(nos)
    })

    updateBasketTradeStatus(basketInstanceId, state = BasketStates.ON_MARKET)

    ViewPortEditSuccess()
  }

  /**
   * Take basket off market rpc call
   */
  override def takeOffMarket(basketInstanceId: String)(ctx: RequestContext): ViewPortAction = {
    val tableRow = table.asTable.pullRow(basketInstanceId)

    logger.debug("Tasking basket off market:" + basketInstanceId + " (row:" + tableRow + ")")

    updateBasketTradeStatus(basketInstanceId, BasketStates.OFF_MARKET)

    getConstituents(basketInstanceId)
      .flatMap(c => omsApi.getOrderId(clientOrderId = c.get(BTC.InstanceIdRic).toString))
      .foreach(orderId => omsApi.cancelOrder(CancelOrder(orderId)))

    ViewPortEditSuccess()
  }

  private def getConstituents(basketInstanceId: String): List[RowData] = {
    val tradingConsTable = tableContainer.getTable(BasketModule.BasketTradingConstituentTable)

    tradingConsTable.primaryKeys.toList
      .map(tradingConsTable.pullRow)
      .filter(_.get(BTC.InstanceId) == basketInstanceId)
  }

  private def updateBasketTradeStatus(basketInstanceId: String, state: String): Unit = {
    table.processUpdate(
      basketInstanceId,
      RowWithData(basketInstanceId, Map(BT.InstanceId -> basketInstanceId, BT.Status -> state)),
      clock.now())
  }

  private def onEditCell(key: String, columnName: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    logger.debug("Change requested for cell value for key:" + key + "(" + columnName + ":" + data + ")")

    val currentData = getRowData(key, columnName)
    if (currentData == data) {
      logger.debug("Current cell value is same and therefore skipping update for key:" + key + "(" + columnName + ":" + data + ")")
    }
    else {
      logger.debug("Changing cell value for key:" + key + "(" + columnName + ":" + data + ")")
      table.processUpdate(key, RowWithData(key, Map(BT.InstanceId -> key, columnName -> data)), clock.now())

      columnName match {
        case BT.Units =>
          val constituentTable = tableContainer.getTable(BasketTradingConstituentTable)
          val constituents = constituentTable.primaryKeys.map(key => constituentTable.pullRow(key)).filter(_.get(BTC.InstanceId) == key)
          constituents.foreach(row => {
            val unitsAsInt = data.asInstanceOf[Int]
            val weighting = row.get(BTC.Weighting)
            val quantity = (weighting.asInstanceOf[Double] * unitsAsInt).toLong
            constituentTable.processUpdate(row.key(), RowWithData(row.key(), Map(BTC.InstanceIdRic -> row.key(), BTC.Quantity -> quantity)), clock.now())
          })
        case BT.Side =>
          val constituentTable = tableContainer.getTable(BasketTradingConstituentTable)
          val constituents = constituentTable.primaryKeys.map(key => constituentTable.pullRow(key)).filter(_.get(BTC.InstanceId) == key)
          constituents.foreach(row => {
            val newSide = row.get(BTC.Side) match {
              case Side.Buy => Side.Sell
              case _ => Side.Buy
            }
            constituentTable.processUpdate(row.key(), RowWithData(row.key(), Map(BTC.InstanceIdRic -> row.key(), BTC.Side -> newSide)), clock.now())
          })
        case _ =>
      }
    }
    ViewPortEditSuccess()
  }

  private def getRowData(rowKey: String, columnName: String): Any = {
    val row = table.pullRow(rowKey, ViewPortColumnCreator.create(table, List(columnName)))
    row.get(columnName)
  }

  override def deleteRowAction(): ViewPortDeleteRowAction = ???

  override def deleteCellAction(): ViewPortDeleteCellAction = ???

  override def addRowAction(): ViewPortAddRowAction = ???

  override def editCellAction(): ViewPortEditCellAction = ViewPortEditCellAction("", onEditCell)

  override def editRowAction(): ViewPortEditRowAction = ???

  override def onFormSubmit(): ViewPortFormSubmitAction = ???

  override def onFormClose(): ViewPortFormCloseAction = ???
}
