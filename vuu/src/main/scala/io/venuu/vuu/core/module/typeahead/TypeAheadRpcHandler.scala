package io.venuu.vuu.core.module.typeahead

import com.typesafe.scalalogging.StrictLogging
import io.venuu.vuu.core.table.{Column, DataTable, TableContainer}
import io.venuu.vuu.net.RequestContext
import io.venuu.vuu.net.rpc.RpcHandler

trait TypeAheadRpcHandler{
  def getUniqueFieldValues(tableMap: Map[String, String], column: String, ctx: RequestContext): Array[String]
  def getUniqueFieldValuesStartingWith(tableMap: Map[String, String], column: String, starts: String, ctx: RequestContext): Array[String]
}


class TypeAheadRpcHandlerImpl(val tableContainer: TableContainer) extends RpcHandler with StrictLogging with TypeAheadRpcHandler {

  private def addUnique(dt: DataTable, c: Column, set: Set[String], key: String):  Set[String] = {
    val row = dt.pullRow(key)
    row.get(c) match {
      case null =>
        Set()
      case x: String =>
        set.+(x)
      case x: Long =>
        set.+(x.toString)
      case x: Double =>
        set.+(x.toString)
      case x: Int =>
        set.+(x.toString)
      case x =>
        set.+(x.toString)
    }
  }


  override def getUniqueFieldValuesStartingWith(tableMap: Map[String, String], column: String, starts: String, ctx: RequestContext): Array[String] = {
    val tableName = tableMap("table")

    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        dataTable.columnForName(column) match {
          case c: Column =>
            dataTable.primaryKeys.foldLeft(Set[String]())(addUnique(dataTable, c, _, _)).filter(_.startsWith(starts)).toArray.sorted.take(10)
          case null =>
            logger.error(s"Column ${column} not found in table ${tableName}")
            Array()
        }
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

  def getUniqueFieldValues(tableMap: Map[String, String], column: String, ctx: RequestContext): Array[String] = {

    val tableName = tableMap("table")

    tableContainer.getTable(tableName) match {
      case dataTable: DataTable =>
        dataTable.columnForName(column) match {
          case c: Column =>
            dataTable.primaryKeys.foldLeft(Set[String]())(addUnique(dataTable, c, _, _)).toArray.sorted.take(10)
          case null =>
            logger.error(s"Column ${column} not found in table ${tableName}")
            Array()
        }
      case null =>
        throw new Exception("Could not find table by name:" + tableName)
    }
  }

}
