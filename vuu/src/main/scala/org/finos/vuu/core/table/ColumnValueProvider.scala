package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging

trait ColumnValueProvider {

  //todo currently only returns first 10 results.. so can't scrolling through values
  //could return everything let ui decide how many results to display but there is cost to the json serialisig for large dataset
  //todo how to handle nulls - for different data types
  //todo should this be returning null or rely on json deserialiser rules?

  def getUniqueValues(columnName:String):Array[String]
  def getUniqueValuesStartingWith(columnName:String, starts: String):Array[String]

}

class InMemColumnValueProvider(dataTable: InMemDataTable) extends ColumnValueProvider with StrictLogging {
  override def getUniqueValues(columnName: String): Array[String] =
    dataTable.columnForName(columnName) match {
    case c: Column =>
      dataTable.primaryKeys.foldLeft(Set[String]())(addUnique(dataTable, c, _, _)).toArray.sorted.take(10)
    case null =>
      logger.error(s"Column $columnName not found in table ${dataTable.name}")
      Array()
  }

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] =
    dataTable.columnForName(columnName) match {
      case c: Column =>
        dataTable.primaryKeys.foldLeft(Set[String]())(addUnique(dataTable, c, _, _)).filter(_.startsWith(starts)).toArray.sorted.take(10)
      case null =>
        logger.error(s"Column $columnName not found in table ${dataTable.name}")
        Array()
    }

  private def addUnique(dt: DataTable, c: Column, set: Set[String], key: String): Set[String] = {
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
}