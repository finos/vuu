package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.viewport.ViewPortColumns

trait ColumnValueProvider {

  def getUniqueValuesVPColumn(columnName: String): Array[String]
  def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String): Array[String]

  @deprecated("to be replaced by getUniqueValuesVPColumn")
  def getUniqueValues(columnName: String): Array[String]
  @deprecated("to be replaced by getUniqueValuesStartingWithVPColumn")
  def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String]

}


object InMemColumnValueProvider {
  def apply(dataTable: DataTable): InMemColumnValueProvider = {
    dataTable match {
      case inMemDataTable: InMemDataTable => new InMemColumnValueProvider(inMemDataTable)
      case d => throw new UnsupportedOperationException(s"Cannot create InMemColumnValueProvider for data table ${d.name} as this is not InMemDataTable.")
    }
  }
}

class InMemColumnValueProvider(dataTable: InMemDataTable) extends ColumnValueProvider with StrictLogging {
  private val get10DistinctValues = DistinctValuesGetter(10)

  def getUniqueValuesVPColumn(columnName: String): Array[String] = {
    val viewPortColumns = ViewPortColumnCreator.create(dataTable, List(columnName))
    viewPortColumns.getColumnForName(columnName) match {
      case Some(column) => get10DistinctValues.fromVP(viewPortColumns, column)
      case None => logger.error(s"Column $columnName not found in table ${dataTable.name}"); Array.empty;
    }
  }

  def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String): Array[String] = {
    val viewPortColumns = ViewPortColumnCreator.create(dataTable, List(columnName))
    viewPortColumns.getColumnForName(columnName) match {
      case Some(column) => get10DistinctValues.fromVP(viewPortColumns, column, _.toLowerCase.startsWith(starts.toLowerCase))
      case None => logger.error(s"Column $columnName not found in table ${dataTable.name}"); Array.empty;
    }
  }

  override def getUniqueValues(columnName: String): Array[String] =
    dataTable.columnForName(columnName) match {
      case c: Column => get10DistinctValues.fromTable(c)
      case null => logger.error(s"Column $columnName not found in table ${dataTable.name}"); Array.empty;
    }

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] =
    dataTable.columnForName(columnName) match {
      case c: Column => get10DistinctValues.fromTable(c, _.toLowerCase.startsWith(starts.toLowerCase))
      case null => logger.error(s"Column $columnName not found in table ${dataTable.name}"); Array.empty;
    }


  private case class DistinctValuesGetter(n: Int) {
    private type Filter = String => Boolean

    def fromTable(c: Column, filter: Filter = _ => true): Array[String] =
      getDistinctValues(c, filter).take(n).toArray

    def fromVP(viewPortColumns: ViewPortColumns, c: Column, filter: Filter = _ => true): Array[String] =
      getDistinctValues(viewPortColumns, c, filter).take(n).toArray

    private def getDistinctValues(c: Column, filter: Filter): Iterator[String] =
      dataTable.primaryKeys
        .iterator
        .map(dataTable.pullRow(_).get(c))
        .distinct
        .flatMap(valueToString)
        .filter(filter)


    //todo if vp column doesnt have table column, return emtpy or error
    private def getDistinctValues(viewPortColumns: ViewPortColumns, column: Column, filter: Filter): Iterator[String] =
      dataTable.primaryKeys
        .iterator
        .map(dataTable.pullRow(_, viewPortColumns).get(column))
        .distinct
        .flatMap(valueToString)
        .filter(filter)

    private def valueToString(value: Any): Option[String] = Option(value).map(_.toString)
  }

}