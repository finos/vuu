package org.finos.vuu.core.module.editable

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef, VisualLinks}
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.{Columns, DataTable, RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.{EditRpcHandler, EditTableRpcHandler, RpcFunctionResult, RpcFunctionSuccess, RpcHandler, RpcParams}
import org.finos.vuu.viewport.{ViewPort, ViewPortAddRowAction, ViewPortDeleteCellAction, ViewPortEditAction, ViewPortEditCellAction, ViewPortEditRowAction, ViewPortEditSuccess, ViewPortFormCloseAction, ViewPortFormSubmitAction}

class EditTableTestService()(using tableContainer: TableContainer) extends EditTableRpcHandler with StrictLogging {

  override def deleteRow(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val vp: ViewPort = params.viewPort

    vp.table.asTable.processDelete(key)
    RpcFunctionSuccess(None)
  }

  override def deleteCell(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val column: String = params.namedParams("column").asInstanceOf[String]
    val vp: ViewPort = params.viewPort

    vp.table.asTable.processUpdate(key, RowWithData(key, Map("rowId" -> key, column -> null)))
    RpcFunctionSuccess(None)
  }

  override def addRow(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val data: Map[String, Any] = params.namedParams("data").asInstanceOf[Map[String, Any]]
    val vp: ViewPort = params.viewPort

    vp.table.asTable.processUpdate(key, RowWithData(key, data))
    RpcFunctionSuccess(None)
  }

  override def editRow(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val data: Map[String, Any] = params.namedParams("data").asInstanceOf[Map[String, Any]]
    val vp: ViewPort = params.viewPort

    vp.table.asTable.processUpdate(key, RowWithData(key, data))
    RpcFunctionSuccess(None)
  }

  override def editCell(params: RpcParams): RpcFunctionResult = {
    val key: String = params.namedParams("key").asInstanceOf[String]
    val column: String = params.namedParams("column").asInstanceOf[String]
    val data: Any = params.namedParams("data")
    val vp: ViewPort = params.viewPort

    vp.table.asTable.processUpdate(key, RowWithData(key, Map("rowId" -> key, column -> data)))
    RpcFunctionSuccess(None)
  }

  override def submitForm(params: RpcParams): RpcFunctionResult = {
    val comment: String = params.namedParams("comment").asInstanceOf[String]
    val vp: ViewPort = params.viewPort
    RpcFunctionSuccess(Some(comment))
  }

  override def closeForm(params: RpcParams): RpcFunctionResult = {
    val vp: ViewPort = params.viewPort
    RpcFunctionSuccess(None)
  }
}

object EditTableTestModule {

  final val NAME = "EDIT_TABLE_TEST"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
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
          service = new EditTableTestService()(using tableContainer)
        )
      ).asModule()

  }

}