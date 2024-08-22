package org.finos.vuu.core.module.typeahead

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcFunctionResult, RpcFunctionSuccess, RpcParams}
import org.finos.vuu.net.{RequestContext, RpcNames}
import org.finos.vuu.viewport.ViewPortColumns

class ViewPortTypeAheadRpcHandler(tableContainer: TableContainer) extends DefaultRpcHandler with StrictLogging {

  this.registerRpc(RpcNames.UniqueFieldValuesRpc, params => processGetUniqueFieldValuesRequestNew(params))
  this.registerRpc(RpcNames.UniqueFieldValuesStartWithRpc, params => processGetUniqueFieldValuesStartWithRequest(params))


  def processGetUniqueFieldValuesRequestNew(params: RpcParams): RpcFunctionResult = {

    val inputParam =  params.data.get.asInstanceOf[Map[String, Any]]

    val values = getUniqueFieldValues(
      inputParam("table").toString, //how to report error when expected param missing or fail to cast to right type
      inputParam("module").toString,
      inputParam("column").toString,
      params.viewPortColumns.get,
      null //todo what to do about request context
    )
    new RpcFunctionSuccess(values)
  }

  def processGetUniqueFieldValuesRequest(params: RpcParams): RpcFunctionResult = {
    val values = getUniqueFieldValues(
      params.namedParams("table").toString, //how to report error when expected param missing or fail to cast to right type
      params.namedParams("module").toString,
      params.namedParams("column").toString,
      params.viewPortColumns.get,
      null //todo what to do about request context
    )
    new RpcFunctionSuccess(values)
  }

  def processGetUniqueFieldValuesStartWithRequest(params: RpcParams): RpcFunctionResult = {
    val values = getUniqueFieldValuesStartingWith(
      params.namedParams("table").toString, //how to report error when expected param missing or fail to cast to right type
      params.namedParams("module").toString,
      params.namedParams("column").toString,
      params.namedParams("starts").toString,
      params.viewPortColumns.get,
      null //todo what to do about request context
    )
    new RpcFunctionSuccess(values) //how to control what viewport action to trigger?
  }

  def getUniqueFieldValues(tableName: String, moduleName: String, column: String, viewPortColumns: ViewPortColumns, ctx: RequestContext): Array[String] = {
    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValuesVPColumn(column, viewPortColumns)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

  def getUniqueFieldValuesStartingWith(tableName: String, moduleName: String, column: String, starts: String, viewPortColumns: ViewPortColumns, ctx: RequestContext): Array[String] = {
    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValuesStartingWithVPColumn(column, starts, viewPortColumns)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

}
