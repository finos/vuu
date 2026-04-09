package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.table.{Column, RowWithData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.net.SortSpec
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

import java.util

trait Sort {
  def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys
}

object Sort {
  def apply(spec: SortSpec, columns: List[Column]): Sort = {
    val sortDirections = spec.sortDefs.map(sd => SortDirection.fromExternal(sd.sortType))
    GenericSort2(columns.toArray, sortDirections.toArray)
  }
}

object NoSort extends Sort {
  override def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    primaryKeys
  }

  override def toString: String = "NoSort"
}

private case class GenericSort2(columns: Array[Column], sortDirections: Array[SortDirection]) extends Sort with StrictLogging {

  private val comparator = SortProjectionComparator(columns, sortDirections)
  private val columnNames = columns.map(_.name)
  private val columnsLength = columns.length
  private val projectionLength = columnsLength + 1

  override def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {

    //This has been repeatedly benchmarked using JMH. If you touch this, do a before and after run of SortBenchmark

    logger.trace("Creating projections")
    val sortProjections = new Array[Array[AnyRef]](primaryKeys.length)
    val rowCount = addProjections(sortProjections, source, primaryKeys, vpColumns)

    logger.trace("Performing sort")
    util.Arrays.sort(sortProjections, 0, rowCount, comparator)

    logger.trace("Creating primary keys")
    val sortedKeys = createKeyArray(sortProjections, rowCount)

    logger.trace("Finished")
    InMemTablePrimaryKeys(sortedKeys)
  }

  private def addProjections(sortProjections: Array[Array[AnyRef]], source: RowSource,
                             primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): Int = {
    val length = primaryKeys.length
    var index = 0
    var count = 0

    while (index < length) {
      val key = primaryKeys.get(index)
      source.pullRow(key, vpColumns) match {
        case r: RowWithData =>
          val projection = new Array[AnyRef](projectionLength)
          projection(0) = r.key
          var columnIndex = 0
          while (columnIndex < columnsLength) {
            val columnValue = r.data.getOrElse(columnNames(columnIndex), null).asInstanceOf[AnyRef]
            projection(columnIndex + 1) = columnValue
            columnIndex += 1
          }
          sortProjections(count) = projection
          count += 1
        case _ =>
      }
      index += 1
    }
    count
  }

  private def createKeyArray(snapshot: Array[Array[AnyRef]], rowCount: Int): ImmutableArray[String] = {
    val iterator = new Iterator[String] {
      private var i = 0
      override def hasNext: Boolean = i < rowCount
      override def next(): String = {
        val key = snapshot(i)(0).asInstanceOf[String]
        i += 1
        key
      }
      override def knownSize: Int = rowCount
    }
    ImmutableArray.from(iterator)
  }

}
