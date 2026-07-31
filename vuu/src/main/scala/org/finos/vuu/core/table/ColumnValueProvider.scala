package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}

import scala.collection.mutable

trait ColumnValueProvider {

  def getUniqueValuesVPColumn(columnName: String, viewPort: ViewPort): Array[String]

  def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPort: ViewPort): Array[String]

}

object InMemColumnValueProvider {
  def apply(dataTable: DataTable): InMemColumnValueProvider = {
    dataTable match {
      case inMemDataTable: InMemDataTable => new InMemColumnValueProvider(inMemDataTable)
      case joinTable: JoinTable => new InMemColumnValueProvider(joinTable)
      case d => throw new UnsupportedOperationException(s"Cannot create InMemColumnValueProvider for data table ${d.name}. Unsupported data table type ${d.getClass.getSimpleName}")
    }
  }
}

class InMemColumnValueProvider(dataTable: DataTable) extends ColumnValueProvider with StrictLogging {

  private val get10DistinctValues = DistinctValuesGetter(10)

  def getUniqueValuesVPColumn(columnName: String, viewPort: ViewPort): Array[String] = {
    val viewPortColumns = viewPort.getColumns
    viewPortColumns.getColumnForName(columnName) match {
      case Some(column) => get10DistinctValues.fromVP(viewPortColumns, column, viewPort.getKeys)
      case None =>
        logger.warn(s"Column $columnName not found in viewport ${viewPort.id}")
        Array.empty
    }
  }

  def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPort: ViewPort): Array[String] = {
    val viewPortColumns = viewPort.getColumns
    viewPortColumns.getColumnForName(columnName) match {
      case Some(column) =>
        get10DistinctValues.fromVP(viewPortColumns, column, viewPort.getKeys, _.toLowerCase.startsWith(starts.toLowerCase))
      case None =>
        logger.warn(s"Column $columnName not found in viewport ${viewPort.id}")
        Array.empty
    }
  }

  private case class DistinctValuesGetter(n: Int) {
    private type Filter = String => Boolean

    def fromVP(viewPortColumns: ViewPortColumns, c: Column, vpKeys: ViewPortKeys, filter: Filter = _ => true): Array[String] = {
      val result = mutable.LinkedHashSet.empty[String]
      val keysIterator = vpKeys.iterator

      while (keysIterator.hasNext && result.size < n) {
        val rawValue = dataTable.pullRow(keysIterator.next(), viewPortColumns).get(c)
        if (rawValue != null) {
          val str = rawValue.toString
          if (filter(str)) {
            result += str
          }
        }
      }

      result.toArray
    }

  }

}
