package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.time.TimeIt.timeIt
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
    val comparator = RowDataComparator.apply(columns, sortDirections)
    GenericSort2(comparator)
  }
}

object NoSort extends Sort {
  override def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    primaryKeys
  }
}

private case class GenericSort2(rowDataComparator: RowDataComparator) extends Sort with StrictLogging {

  override def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {

    //This has been repeatedly benchmarked using JMH. If you touch this, do a before and after run of SortBenchmark

    val buffer = SortBuffer.borrow(primaryKeys.length)
    
    logger.trace("Starting map")

    val (millisToArray, count) = timeIt {
      createSnapshot(source, primaryKeys, vpColumns, buffer)
    }

    logger.trace("Starting sort")

    val (millisSort, _ ) = timeIt {
      util.Arrays.sort(buffer, 0, count, rowDataComparator)
    }

    logger.trace("Starting build imm arr")

    val (millisImmArray, immutableArray) = timeIt {
      createKeyArray(buffer, count)
    }

    logger.debug(s"[SORT]: Table Size: ${primaryKeys.length} DataToArray: ${millisToArray}ms, Sort: ${millisSort}ms, ImmutArr: ${millisImmArray}ms")
    
    SortBuffer.release(buffer, primaryKeys.length)
    
    InMemTablePrimaryKeys(immutableArray)
  }

  private def createSnapshot(source: RowSource, primaryKeys: TablePrimaryKeys, 
                             vpColumns: ViewPortColumns,
                             sortBuffer: Array[RowWithData]): Int = {
    val length = primaryKeys.length
    var index = 0
    var count = 0

    while (index < length) {
      val key = primaryKeys.get(index)
      source.pullRow(key, vpColumns) match {
        case r: RowWithData =>
          sortBuffer(count) = r
          count += 1
        case _ =>
      }
      index += 1
    }
    count
  }

  private def createKeyArray(snapshot: Array[RowWithData], length: Int): ImmutableArray[String] = {
    val keys = new Array[String](length)
    var i = 0
    while (i < length) {
      keys(i) = snapshot(i).key
      i += 1
    }
    ImmutableArray.from(keys)
  }

}
