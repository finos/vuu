package org.finos.vuu.core.module.typeahead

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcMethodCallResult, RpcMethodSuccess, RpcParams}
import org.finos.vuu.net.{RequestContext, RpcNames}

class ViewPortTypeAheadRpcHandler(tableContainer: TableContainer) extends DefaultRpcHandler with StrictLogging {

  this.registerRpc(RpcNames.UniqueFieldValuesRpc, params => processGetUniqueFieldValuesRequest(params))
  this.registerRpc(RpcNames.UniqueFieldValuesStartWithRpc, params => processGetUniqueFieldValuesStartWithRequest(params))

  def processGetUniqueFieldValuesRequest(params: RpcParams): RpcMethodCallResult = {
    val values = getUniqueFieldValues(
      params.namedParams("table").toString, //how to report error when expected param missing or fail to cast to right type
      params.namedParams("module").toString,
      params.namedParams("column").toString,
      null //todo what to do about request context
    )
    new RpcMethodSuccess(values)
  }

  def processGetUniqueFieldValuesStartWithRequest(params: RpcParams): RpcMethodCallResult = {
    val values = getUniqueFieldValuesStartingWith(
      params.namedParams("table").toString, //how to report error when expected param missing or fail to cast to right type
      params.namedParams("module").toString,
      params.namedParams("column").toString,
      params.namedParams("starts").toString,
      null //todo what to do about request context
    )
    new RpcMethodSuccess(values) //how to control what viewport action to trigger?
  }

  def getUniqueFieldValues(tableName: String, moduleName: String, column: String, ctx: RequestContext): Array[String] = {
    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValues(column)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

  def getUniqueFieldValuesStartingWith(tableName: String, moduleName: String, column: String, starts: String, ctx: RequestContext): Array[String] = {
    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValuesStartingWith(column, starts)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

}
