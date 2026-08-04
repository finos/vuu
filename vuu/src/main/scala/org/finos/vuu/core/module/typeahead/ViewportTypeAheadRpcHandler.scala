package org.finos.vuu.core.module.typeahead

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcFunctionResult, RpcFunctionSuccess, RpcNames, RpcParams}
import org.finos.vuu.viewport.ViewPort

class ViewportTypeAheadRpcHandler(tableContainer: TableContainer) {

  def register(rpcRegistry: DefaultRpcHandler): Unit = {
    rpcRegistry.registerRpc(RpcNames.UniqueFieldValuesRpc, params => processGetUniqueFieldValuesRequest(params))
    rpcRegistry.registerRpc(RpcNames.UniqueFieldValuesStartWithRpc, params => processGetUniqueFieldValuesStartWithRequest(params))
  }

  private def processGetUniqueFieldValuesRequest(params: RpcParams): RpcFunctionResult = {
    val inputParam =  params.namedParams
    val values = getUniqueFieldValues(
      inputParam("column").toString,
      params.viewPort
    )
    new RpcFunctionSuccess(values)
  }

  private def processGetUniqueFieldValuesStartWithRequest(params: RpcParams): RpcFunctionResult = {
    val inputParam = params.namedParams
    val values = getUniqueFieldValuesStartingWith(
      inputParam("column").toString,
      inputParam("starts").toString,
      params.viewPort
    )
    new RpcFunctionSuccess(values)
  }

  private def getUniqueFieldValues(column: String, viewPort: ViewPort): Array[String] = {
    val columnValueProvider = viewPort.table.asTable.getColumnValueProvider
    columnValueProvider.getUniqueValuesVPColumn(column, viewPort)
  }

  private def getUniqueFieldValuesStartingWith(column: String, starts: String, viewPort: ViewPort): Array[String] = {
    val columnValueProvider = viewPort.table.asTable.getColumnValueProvider
    columnValueProvider.getUniqueValuesStartingWithVPColumn(column, starts, viewPort)
  }

}
