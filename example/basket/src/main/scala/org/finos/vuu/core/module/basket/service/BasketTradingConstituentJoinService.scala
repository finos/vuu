package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.module.basket.BasketConstants.Side
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.basket.BasketModule.{BasketConstituentColumnNames => BCColumnName, BasketTradingColumnNames => BTColumnName, BasketTradingConstituentColumnNames => ColumnName}
import org.finos.vuu.core.module.basket.result.ErrorReason
import org.finos.vuu.core.table._
import org.finos.vuu.net.rpc.{DefaultRpcHandler, EditRpcHandler, RpcFunctionFailure, RpcFunctionResult, RpcFunctionSuccess, RpcParams}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.viewport._

import scala.util.control.NonFatal


trait BasketTradingConstituentJoinServiceIF extends EditRpcHandler {
  def setSell(params: RpcParams): RpcFunctionResult

  def setBuy(params: RpcParams): RpcFunctionResult

  def addConstituent(params: RpcParams): RpcFunctionResult
}

class BasketTradingConstituentJoinService(val table: DataTable)(implicit clock: Clock, val tableContainer: TableContainer) extends DefaultRpcHandler with BasketTradingConstituentJoinServiceIF with StrictLogging {
  registerRpc("setSell", params => setSell(params))
  registerRpc("setBuy", params => setBuy(params))
  registerRpc("addConstituent", params => addConstituent(params))

  override def menuItems(): ViewPortMenu = ViewPortMenu("Direction",
    new SelectionViewPortMenuItem("Set Sell", "", this.setSell, "SET_SELECTION_SELL"),
    new SelectionViewPortMenuItem("Set Buy", "", this.setBuy, "SET_SELECTION_Buy"),
  )

  override def deleteRowAction(): ViewPortDeleteRowAction = ViewPortDeleteRowAction("", this.onDeleteRow)

  override def deleteCellAction(): ViewPortDeleteCellAction = ViewPortDeleteCellAction("", this.onDeleteCell)

  override def addRowAction(): ViewPortAddRowAction = ViewPortAddRowAction("", this.onAddRow)

  override def editCellAction(): ViewPortEditCellAction = ViewPortEditCellAction("", this.onEditCell)

  override def editRowAction(): ViewPortEditRowAction = ViewPortEditRowAction("", this.onEditRow)

  override def onFormSubmit(): ViewPortFormSubmitAction = ViewPortFormSubmitAction("", this.onFormSubmit)

  override def onFormClose(): ViewPortFormCloseAction = ViewPortFormCloseAction("", this.onFormClose)

  override def setSell(params: RpcParams): RpcFunctionResult = {
    val selection: ViewPortSelection = params.namedParams("selection").asInstanceOf[ViewPortSelection]
    updateSelectedForRpc(selection, Map(ColumnName.Side -> Side.Sell))
  }

  def setSell(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {
    updateSelected(selection, Map(ColumnName.Side -> Side.Sell))
  }

  override def setBuy(params: RpcParams): RpcFunctionResult = {
    val selection: ViewPortSelection = params.namedParams("selection").asInstanceOf[ViewPortSelection]
    updateSelectedForRpc(selection, Map(ColumnName.Side -> Side.Buy))
  }

  def setBuy(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {
    updateSelected(selection, Map(ColumnName.Side -> Side.Buy))
  }

  //this is RCP call and method name is part of contract with UI
  override def addConstituent(params: RpcParams): RpcFunctionResult = {
    val ric: String = params.namedParams("ric").asInstanceOf[String]
    if (table.size() == 0)
      RpcFunctionFailure(1, s"Failed to add constituents to ${table.name} as adding row to empty table is currently not supported", null)
    else {
      val existingConstituentRow = table.pullRow(table.primaryKeys.head)
      val tradeId = existingConstituentRow.get(ColumnName.InstanceId).asInstanceOf[String]

      val tradeRow = tableContainer.getTable(BasketModule.BasketTradingTable).pullRow(tradeId)
      val basketId = tradeRow.get(BTColumnName.BasketId).asInstanceOf[String]
      val tradeUnit = tradeRow.get(BTColumnName.Units).asInstanceOf[Int]

      val basketConstituentRows = getConstituentsWith(ric) //todo what to do when multiple result?
      val description =
        if (basketConstituentRows.nonEmpty)
          basketConstituentRows.head.get(BCColumnName.Description).asInstanceOf[String]
        else ""

      val newRow = mkTradingConstituentRow(
        basketTradeInstanceId = tradeId,
        sourceBasketId = basketId,
        tradeUnit = tradeUnit,
        ric = ric,
        description = description)

      //todo should we guard against adding row for ric that already exist?
      updateJoinTable(Array(newRow)) match {
        case Right(_) => RpcFunctionSuccess(Some(newRow.key))
        case Left(errorReason) =>
          RpcFunctionFailure(1, errorReason.reason, null)
      }
    }
  }

  private def getConstituentsWith(ric: String): List[RowData] = {
    val table = tableContainer.getTable(BasketModule.BasketConstituentTable)
    val keys = table.primaryKeys.toList
    keys.map(key => table.pullRow(key)).filter(_.get(BCColumnName.Ric).toString == ric)
  }

  private def onEditCell(key: String, columnName: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    try {
      getBaseTable() match {
        case Some(baseTable: DataTable) =>
          columnName match {
            case ColumnName.Weighting | ColumnName.LimitPrice =>
              val doubleValue = convertToDouble(data)
              baseTable.processUpdate(key, RowWithData(key, Map(ColumnName.InstanceIdRic -> key, columnName -> doubleValue)))
            case _ => baseTable.processUpdate(key, RowWithData(key, Map(ColumnName.InstanceIdRic -> key, columnName -> data)))
          }
          ViewPortEditSuccess()
        case None =>
          ViewPortEditFailure("Could not find base table for basket trading constituent join ")
      }
    } catch {
      case NonFatal(t) => ViewPortEditFailure(s"Could not update $columnName. $t")
    }
  }

  private def convertToDouble(data: Any): Double = {
    data match {
      case decimalValue: java.math.BigDecimal =>
        decimalValue.doubleValue
      case integer: java.lang.Integer => integer.toDouble
      case int: Int => int.toDouble
      case _ => data.asInstanceOf[Double]
    }
  }

  private def onEditRow(key: String, row: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val table = vp.table.asTable
    table.processUpdate(key, RowWithData(key, row))
    ViewPortEditSuccess()
  }

  private def onDeleteRow(key: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  private def onDeleteCell(key: String, column: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  private def onAddRow(key: String, data: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
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

  private def getBaseTable(): Option[DataTable] = {
    val joinTable = table.asTable.asInstanceOf[JoinTable]
    val baseTableDef = joinTable.getTableDef.asInstanceOf[JoinTableDef].baseTable
    joinTable.sourceTables.get(baseTableDef.name)
  }

  private def updateJoinTable(rows: Array[RowWithData]): Either[ErrorReason, Unit] = {
    getBaseTable() match {
      case Some(baseTable: DataTable) =>
        rows.foreach(row =>
          baseTable.processUpdate(row.key, row)
        )
        Right()
      case None =>
        Left(ErrorReason(s"Could not find base table for ${table.name}"))
    }
  }

  private def updateSelectedForRpc(selection: ViewPortSelection, updates: Map[String, Any]): RpcFunctionSuccess = {
    val selectedKeys = selection.rowKeyIndex.map({ case (key, _) => key }).toList
    val updateRows = selectedKeys.map(key => {
      //require source table primary key for join table updates
      val sourceTableKey = Map(ColumnName.InstanceIdRic -> key)
      RowWithData(key, sourceTableKey ++ updates)
    })

    updateJoinTable(updateRows.toArray) match {
      case Right(_) => RpcFunctionSuccess(None)
      case Left(errorReason) =>
        logger.debug(s"Could not update selection values${errorReason.reason}")
        //TODO #1663 do we want to send success or failure
        RpcFunctionSuccess(None)
    }
  }

  private def updateSelected(selection: ViewPortSelection, updates: Map[String, Any]): ViewPortAction = {
    val selectedKeys = selection.rowKeyIndex.map({ case (key, _) => key }).toList
    val updateRows = selectedKeys.map(key => {
      //require source table primary key for join table updates
      val sourceTableKey = Map(ColumnName.InstanceIdRic -> key)
      RowWithData(key, sourceTableKey ++ updates)
    })

    updateJoinTable(updateRows.toArray) match {
      case Right(_) => NoAction()
      case Left(errorReason) =>
        logger.debug(s"Could not update selection values${errorReason.reason}")
        NoAction()
    }
  }

  private def mkTradingConstituentRow(basketTradeInstanceId: String, sourceBasketId: String, tradeUnit: Int, ric: String, description: String): RowWithData = {
    val constituentKey = s"$basketTradeInstanceId.$ric"
    val weighting: Double = 0.1
    RowWithData(
      constituentKey,
      Map(
        ColumnName.Ric -> ric,
        ColumnName.BasketId -> sourceBasketId,
        ColumnName.InstanceId -> basketTradeInstanceId,
        ColumnName.InstanceIdRic -> constituentKey,
        ColumnName.Quantity -> (weighting * 100).asInstanceOf[Long],
        ColumnName.Description -> description,
        ColumnName.Side -> Side.Buy,
        ColumnName.Weighting -> weighting,
        ColumnName.PriceStrategyId -> 2,
        ColumnName.Algo -> -1,
      ))
  }

}
