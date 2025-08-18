package org.finos.vuu.core.module.editable

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef, VisualLinks}
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.{Columns, DataTable, RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{EditRpcHandler, RpcHandler}
import org.finos.vuu.viewport.{ViewPort, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortDeleteRowAction, ViewPortEditAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortEditSuccess, ViewPortFormCloseAction, ViewPortFormSubmitAction}

trait TestEditableServiceIF extends EditRpcHandler {

}

class TestEditableService(val table: DataTable, val tableContainer: TableContainer)(implicit clock: Clock) extends RpcHandler with TestEditableServiceIF with StrictLogging {

  def addRow(key: String, data: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    table.processUpdate(key, RowWithData(key, data))
    ViewPortEditSuccess()
  }

  def editRow(key: String, data: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    table.processUpdate(key, RowWithData(key, data))
    ViewPortEditSuccess()
  }

  def editCell(key: String, column: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    table.processUpdate(key, RowWithData(key, Map("rowId" -> key, column -> data)))
    ViewPortEditSuccess()
  }

  def deleteRow(key: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    table.processDelete(key)
    ViewPortEditSuccess()
  }

  def deleteCell(key: String, column: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    table.processUpdate(key, RowWithData(key, Map("rowId" -> key, column -> null)))
    ViewPortEditSuccess()
  }

  def formSubmit(vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    //table.processUpdate(key, RowWithData(key, Map("rowId" -> key, column -> null)), clock.now())
    ViewPortEditSuccess()
  }

  def formClose(vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    //table.processUpdate(key, RowWithData(key, Map("rowId" -> key, column -> null)), clock.now())
    ViewPortEditSuccess()
  }

  override def deleteRowAction(): ViewPortDeleteRowAction = ViewPortDeleteRowAction("", deleteRow)
  override def deleteCellAction(): ViewPortDeleteCellAction = ViewPortDeleteCellAction("", deleteCell)
  override def addRowAction(): ViewPortAddRowAction = ViewPortAddRowAction("", addRow)
  override def editCellAction(): ViewPortEditCellAction = ViewPortEditCellAction("", editCell)
  override def editRowAction(): ViewPortEditRowAction = ViewPortEditRowAction("", editRow)
  override def onFormSubmit(): ViewPortFormSubmitAction = ViewPortFormSubmitAction("", formSubmit)
  override def onFormClose(): ViewPortFormCloseAction = ViewPortFormCloseAction("", formClose)
}

object EditableTestModule {

  final val NAME = "EDITTEST"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        //this table should contain one row for each of .FTSE, .DJI, .HSI, .etc...
        TableDef(
          name = "editTestTable",
          keyField = "rowId",
          columns = Columns.fromNames("rowId".string(), "A".string(), "B".double(), "C".int(), "D".boolean()),
          VisualLinks(),
          joinFields = "rowId"
        ),
        (table, _) => new NullProvider(),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new TestEditableService(table, tableContainer)
        )
      ).asModule()

  }

}
