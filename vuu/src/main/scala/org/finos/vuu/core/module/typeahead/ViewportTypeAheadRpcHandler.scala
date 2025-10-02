package org.finos.vuu.core.module.typeahead

import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.net.{RequestContext, RpcNames}
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcFunctionResult, RpcFunctionSuccess, RpcParams}
import org.finos.vuu.viewport.ViewPortColumns

class ViewportTypeAheadRpcHandler(tableContainer: TableContainer) {

  def register(rpcRegistry: DefaultRpcHandler): Unit = {
    rpcRegistry.registerRpc(RpcNames.UniqueFieldValuesRpc, params => processGetUniqueFieldValuesRequest(params))
    rpcRegistry.registerRpc(RpcNames.UniqueFieldValuesStartWithRpc, params => processGetUniqueFieldValuesStartWithRequest(params))
  }

  def processGetUniqueFieldValuesRequest(params: RpcParams): RpcFunctionResult = {

    val inputParam =  params.namedParams

    val values = getUniqueFieldValues(
      inputParam("table").toString, //how to report error when expected param missing or fail to cast to right type
      inputParam("module").toString,
      inputParam("column").toString,
      params.viewPort.getColumns,
      params.viewPort.getKeys,
      null //todo what to do about request context
    )
    new RpcFunctionSuccess(values)
  }

  def processGetUniqueFieldValuesStartWithRequest(params: RpcParams): RpcFunctionResult = {

    val inputParam =  params.namedParams

    val values = getUniqueFieldValuesStartingWith(
      inputParam("table").toString, //how to report error when expected param missing or fail to cast to right type
      inputParam("module").toString,
      inputParam("column").toString,
      inputParam("starts").toString,
      params.viewPort.getColumns,
      params.viewPort.getKeys,
      null //todo what to do about request context
    )
    new RpcFunctionSuccess(values) //how to control what viewport action to trigger?
  }


  def getUniqueFieldValues(tableName: String, moduleName: String, column: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys, ctx: RequestContext): Array[String] = {
    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValuesVPColumn(column, viewPortColumns, vpKeys)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

  def getUniqueFieldValuesStartingWith(tableName: String, moduleName: String, column: String, starts: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys, ctx: RequestContext): Array[String] = {
    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValuesStartingWithVPColumn(column, starts, viewPortColumns, vpKeys)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }
}
