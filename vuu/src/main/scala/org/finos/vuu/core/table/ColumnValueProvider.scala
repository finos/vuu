package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging

trait ColumnValueProvider {
  def getUniqueValues(columnName:String):Array[String]
  def getUniqueValuesStartingWith(columnName:String, starts: String):Array[String]
}

class EmptyColumnValueProvider extends ColumnValueProvider {
  override def getUniqueValues(columnName: String): Array[String] = Array.empty

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] = Array.empty
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

  override def getUniqueValues(columnName: String): Array[String] =
    dataTable.columnForName(columnName) match {
    case c: Column => get10DistinctValues(c)
    case null      => logger.error(s"Column $columnName not found in table ${dataTable.name}"); Array.empty;
  }

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] =
    dataTable.columnForName(columnName) match {
      case c: Column => get10DistinctValues(c, _.startsWith(starts))
      case null      => logger.error(s"Column $columnName not found in table ${dataTable.name}"); Array.empty;
    }


  private case class DistinctValuesGetter(n: Int) {
    private type Filter = String => Boolean

    def apply(c: Column, filter: Filter = _ => true): Array[String] = getDistinctValues(c, filter).take(n).toArray

    private def getDistinctValues(c: Column, filter: Filter): Iterator[String] = {
      dataTable.primaryKeys
        .iterator
        .map(dataTable.pullRow(_).get(c))
        .distinct
        .flatMap(valueToString)
        .filter(filter)
    }

    private def valueToString(value: Any): Option[String] = Option(value).map(_.toString)
  }

}