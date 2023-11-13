package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingConstituentTable, Sides}
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{EditRpcHandler, RpcHandler}
import org.finos.vuu.viewport.{ViewPort, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortDeleteRowAction, ViewPortEditAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortEditSuccess, ViewPortFormCloseAction, ViewPortFormSubmitAction}

trait BasketTradingServiceIF extends EditRpcHandler{

}

class BasketTradingService(val table: DataTable, val tableContainer: TableContainer)(implicit clock: Clock) extends RpcHandler with BasketTradingServiceIF with StrictLogging {

  import org.finos.vuu.core.module.basket.BasketModule.{BasketConstituentColumnNames => BC, BasketTradingColumnNames => BT, BasketTradingConstituentColumnNames => BTC}

  private def onEditCell(key: String, columnName: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    logger.info("Changing cell value for key:" + key + "(" + columnName + ":" + data + ")")
    table.processUpdate(key, RowWithData(key, Map(BT.InstanceId -> key, columnName -> data)), clock.now())

    columnName match {
      case BT.Units =>
        val constituentTable = tableContainer.getTable(BasketTradingConstituentTable)
        val constituents = constituentTable.primaryKeys.map(key => constituentTable.pullRow(key)).filter(_.get(BTC.InstanceId) == key)
        constituents.foreach( row => {
            val unitsAsInt = data.asInstanceOf[Int]
            val weighting = row.get(BTC.Weighting)
            val quantity = (weighting.asInstanceOf[Double] * unitsAsInt).toLong
            constituentTable.processUpdate(row.key(), RowWithData(row.key(), Map(BTC.InstanceIdRic -> row.key(), BTC.Quantity -> quantity)), clock.now())
        })
      case BT.Side =>
        val constituentTable = tableContainer.getTable(BasketTradingConstituentTable)
        val constituents = constituentTable.primaryKeys.map(key => constituentTable.pullRow(key)).filter(_.get(BTC.InstanceId) == key)
        val side = data.asInstanceOf[String]
        constituents.foreach(row => {
          val newSide = row.get(BTC.Side) match {
            case Sides.Buy => Sides.Sell
            case _ => Sides.Buy
          }
          constituentTable.processUpdate(row.key(), RowWithData(row.key(), Map(BTC.InstanceIdRic -> row.key(), BTC.Side -> newSide)), clock.now())
        })

      case _ =>
    }

    ViewPortEditSuccess()
    }
  override def deleteRowAction(): ViewPortDeleteRowAction = ???

  override def deleteCellAction(): ViewPortDeleteCellAction = ???

  override def addRowAction(): ViewPortAddRowAction = ???

  override def editCellAction(): ViewPortEditCellAction = ViewPortEditCellAction("", onEditCell)
  override def editRowAction(): ViewPortEditRowAction = ???

  override def onFormSubmit(): ViewPortFormSubmitAction = ???

  override def onFormClose(): ViewPortFormCloseAction = ???

}
