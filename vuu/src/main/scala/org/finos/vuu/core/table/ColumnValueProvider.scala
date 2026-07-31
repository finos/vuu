package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}

import java.util
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

  def getUniqueValuesVPColumn(columnName: String, viewPort: ViewPort): Array[String] =
    fetchUniqueStringValues(columnName, viewPort)

  def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPort: ViewPort): Array[String] = {
    val prefix = starts.toLowerCase
    fetchUniqueStringValues(columnName, viewPort, _.toLowerCase.startsWith(prefix))
  }

  private def fetchUniqueStringValues(
                                       columnName: String,
                                       viewPort: ViewPort,
                                       filter: String => Boolean = _ => true
                                     ): Array[String] = {
    val viewPortColumns = viewPort.getColumns
    viewPortColumns.getColumnForName(columnName) match {
      case Some(column) if column.dataType == DataType.StringDataType =>
        get10DistinctValues.fromVP(viewPortColumns, column, viewPort.getKeys, filter)
      case Some(_) =>
        logger.warn(s"Column $columnName in viewport ${viewPort.id} is not of type String")
        Array.empty
      case None =>
        logger.warn(s"Column $columnName not found in viewport ${viewPort.id}")
        Array.empty
    }
  }

  private case class DistinctValuesGetter(n: Int) {
    private type Filter = String => Boolean

    def fromVP(viewPortColumns: ViewPortColumns, c: Column, vpKeys: ViewPortKeys, filter: Filter = _ => true): Array[String] = {
      val seen = mutable.HashSet.empty[String]
      val result = new Array[String](n)
      var count = 0
      val keysIterator = vpKeys.iterator

      while (keysIterator.hasNext && count < n) {
        dataTable.pullRow(keysIterator.next(), viewPortColumns).get(c) match {
          case str: String =>
            if (filter(str) && seen.add(str)) {
              result(count) = str
              count += 1
            }
          case _ => //Do nothing
        }
      }

      if (count == n) result
      else util.Arrays.copyOf(result, count)
    }
  }
}