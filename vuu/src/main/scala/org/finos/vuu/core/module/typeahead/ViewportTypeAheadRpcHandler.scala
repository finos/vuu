package org.finos.vuu.core.module.typeahead

import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.net.RequestContext
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcFunctionResult, RpcFunctionSuccess, RpcNames, RpcParams}
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}

class ViewportTypeAheadRpcHandler(tableContainer: TableContainer) {

  def register(rpcRegistry: DefaultRpcHandler): Unit = {
    rpcRegistry.registerRpc(RpcNames.UniqueFieldValuesRpc, params => processGetUniqueFieldValuesRequest(params))
    rpcRegistry.registerRpc(RpcNames.UniqueFieldValuesStartWithRpc, params => processGetUniqueFieldValuesStartWithRequest(params))
  }

  private def processGetUniqueFieldValuesRequest(params: RpcParams): RpcFunctionResult = {

    val inputParam =  params.namedParams

    val values = getUniqueFieldValues(
      inputParam("table").toString, //how to report error when expected param missing or fail to cast to right type
      inputParam("module").toString,
      inputParam("column").toString,
      params.viewPort,
      null //todo what to do about request context
    )
    new RpcFunctionSuccess(values)
  }

  private def processGetUniqueFieldValuesStartWithRequest(params: RpcParams): RpcFunctionResult = {

    val inputParam = params.namedParams

    val values = getUniqueFieldValuesStartingWith(
      inputParam("table").toString, //how to report error when expected param missing or fail to cast to right type
      inputParam("module").toString,
      inputParam("column").toString,
      inputParam("starts").toString,
      params.viewPort,
      null //todo what to do about request context
    )
    new RpcFunctionSuccess(values) //how to control what viewport action to trigger?
  }

  private def getUniqueFieldValues(tableName: String, moduleName: String, column: String, viewPort: ViewPort, ctx: RequestContext): Array[String] = {
    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValuesVPColumn(column, viewPort)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

  private def getUniqueFieldValuesStartingWith(tableName: String, moduleName: String, column: String, starts: String, viewPort: ViewPort, ctx: RequestContext): Array[String] = {
    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValuesStartingWithVPColumn(column, starts, viewPort)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

}
