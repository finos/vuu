package org.finos.vuu.core.module.typeahead

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.RequestContext
import org.finos.vuu.net.rpc.RpcHandler

class GenericTypeAheadRpcHandler(val tableContainer: TableContainer) extends TypeAheadRpcHandler with RpcHandler with StrictLogging {

  def getUniqueFieldValues(tableMap: Map[String, String], column: String, ctx: RequestContext): Array[String] = {

    logger.info(s"[TESTING] getting unique field value $column")
    val tableName = tableMap("table")

    tableContainer.getTable(tableName) match {
      //case virtualisedSessionTable: VirtualizedSessionTable =>
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValues(column)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

  override def getUniqueFieldValuesStartingWith(tableMap: Map[String, String], column: String, starts: String, ctx: RequestContext): Array[String] = {

    logger.info(s"[TESTING] getting unique field value $column starting with $starts")
    val tableName = tableMap("table")

    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        val columValueProvider = dataTable.getColumnValueProvider
        columValueProvider.getUniqueValuesStartingWith(column, starts)
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }
}
