package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.module.basket.BasketConstants.Side
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingTable, BasketTradingColumnNames => BTColumnName, BasketTradingConstituentColumnNames => ColumnName}
import org.finos.vuu.core.table.{DataTable, JoinTable, RowData, RowWithData, TableContainer}
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.net.rpc.{EditRpcHandler, RpcHandler}
import org.finos.vuu.viewport._

trait BasketTradingConstituentJoinServiceIF extends EditRpcHandler {
  def setSell(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction

  def setBuy(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction
}

object BasketTradingConstituentJoinService {}

class BasketTradingConstituentJoinService(val table: DataTable, val tableContainer: TableContainer)(implicit clock: Clock) extends BasketTradingConstituentJoinServiceIF with RpcHandler with StrictLogging {

  def onDeleteRow(key: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {

    ViewPortEditSuccess()
  }

  def onDeleteCell(key: String, column: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  def onAddRow(key: String, data: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  def testAddConstituent(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {
    addConstituents(Array("VOD.L", "BP.L"))
    //todo handle failure
  }
  def addConstituents(rics: Array[String]): ViewPortEditAction = {
  //def addConstituents(rics: Array[String])(ctx: RequestContext): ViewPortEditAction = {
    //todo handle if no rows
    if(table.size() == 0)
      ViewPortEditFailure(s"Failed to add constituents to ${table.name} as adding row to empty table is currently not supported")

    val existingConstituentRow = table.pullRow(table.primaryKeys.head)
    val tradeId = existingConstituentRow.get(ColumnName.InstanceId).asInstanceOf[String]

    val tradeRow = tableContainer.getTable(BasketModule.BasketTradingTable).pullRow(tradeId)
    val basketId = tradeRow.get(BTColumnName.BasketId).asInstanceOf[String]
    val tradeUnit = tradeRow.get(BTColumnName.Units).asInstanceOf[Int]

    rics.foreach(ric => {

      //todo should we guard against adding row for ric that already exist?
      val newRow = mkTradingConstituentRow(
        basketTradeInstanceId = tradeId,
        sourceBasketId = basketId,
        tradeUnit = tradeUnit,
        ric = ric)

      updateJoinTable(table, newRow)

      logger.info(s"added constituent $ric")
    })

    ViewPortEditSuccess()

  }

  private def mkTradingConstituentRow(basketTradeInstanceId: String, sourceBasketId:String, tradeUnit:Int, ric: String): RowWithData = {
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
        ColumnName.Description -> "", //todo look up description from instrument table
        ColumnName.Side -> Side.Buy,
        ColumnName.Weighting -> weighting,
        ColumnName.PriceStrategyId -> 2,
        ColumnName.Algo -> -1,
      ))
  }

  def updateJoinTable(table: DataTable, row: RowWithData): Unit = {
    val joinTable = table.asTable.asInstanceOf[JoinTable]
    val baseTableDef = joinTable.getTableDef.asInstanceOf[JoinTableDef].baseTable
    joinTable.sourceTables.get(baseTableDef.name) match {
      case Some(table: DataTable) =>
        table.processUpdate(row.key, row, clock.now())
      case None =>
      //log and throw?
    }
  }
  private def onEditCell(key: String, columnName: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val joinTable = vp.table.asTable.asInstanceOf[JoinTable]
    val baseTableDef = joinTable.getTableDef.asInstanceOf[JoinTableDef].baseTable
    joinTable.sourceTables.get(baseTableDef.name) match {
      case Some(table: DataTable) =>
        table.processUpdate(key, RowWithData(key, Map(ColumnName.InstanceIdRic -> key, columnName -> data)), clock.now())
        ViewPortEditSuccess()
      case None =>
        ViewPortEditFailure("Could not find base table")
    }
  }

  private def onEditRow(key: String, row: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val table = vp.table.asTable
    table.processUpdate(key, RowWithData(key, row), clock.now())
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
    updateSelected(selection,  Map(ColumnName.Side -> Side.Sell))
  }

  def setBuy(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {
    updateSelected(selection,  Map(ColumnName.Side -> Side.Buy))
  }

  private def updateSelected(selection: ViewPortSelection, updates: Map[String, Any]): ViewPortAction = {
    val selectedKeys = selection.rowKeyIndex.map({ case (key, _) => key }).toList
    selectedKeys.foreach(key => {
      //require source table primary key for join table updates
      val sourceTableKey = Map(ColumnName.InstanceIdRic -> key)
      update(key, sourceTableKey ++ updates)
    })
    //todo handle error
    //todo care about checking current value? simpler not to
    ViewPortEditSuccess()
  }

  //todo can update multiple rows in one go?
  private def update(key: String, keyValuesToUpdate: Map[String, Any]): Unit = {
    val joinTable = table.asTable.asInstanceOf[JoinTable]
    val baseTableDef = joinTable.getTableDef.asInstanceOf[JoinTableDef].baseTable
    joinTable.sourceTables.get(baseTableDef.name) match {
      case Some(table: DataTable) =>
        table.processUpdate(key, RowWithData(key, keyValuesToUpdate), clock.now())
        ViewPortEditSuccess()
      case None =>
        ViewPortEditFailure("Could not find base table")
    }
  }
  override def menuItems(): ViewPortMenu = ViewPortMenu("Direction",
    new SelectionViewPortMenuItem("Set Sell", "", this.setSell, "SET_SELECTION_SELL"),
    new SelectionViewPortMenuItem("Set Buy", "", this.setBuy, "SET_SELECTION_Buy"),
    new SelectionViewPortMenuItem("Add Row", "", this.testAddConstituent, "TEST_ADD_ROW"),
  )
}
