package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.core.table.{Column, RowData, RowWithData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.net.SortSpec
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

import java.util

trait Sort {
  def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys
}

object Sort {
  def apply(spec: SortSpec, columns: List[Column]): Sort = GenericSort2(spec, columns)
}

object NoSort extends Sort {
  override def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    primaryKeys
  }
}

private case class GenericSort2(spec: SortSpec, columns: List[Column]) extends Sort with StrictLogging {

  private val sortDirections = spec.sortDefs.map(sd => SortDirection.fromExternal(sd.sortType))
  private val comparator = new java.util.Comparator[RowData] {
    override def compare(o1: RowData, o2: RowData): Int =
      SortCompares.compare(o1, o2, columns, sortDirections, 0)
  }

  override def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {

    //This has been repeatedly benchmarked using JMH. If you touch this, do a before and after run of SortBenchmark

    logger.trace("Starting map")

    val (millisToArray, snapshot) = timeIt {
      createSnapshot(source, primaryKeys, vpColumns)
    }

    logger.trace("Starting sort")

    val (millisSort, _ ) = timeIt {
      util.Arrays.sort(snapshot, comparator)
    }

    logger.trace("Starting build imm arr")

    val (millisImmArray, immutableArray) = timeIt {
      createKeyArray(snapshot)
    }

    logger.debug(s"[SORT]: Table Size: ${primaryKeys.length} DataToArray: ${millisToArray}ms, Sort: ${millisSort}ms, ImmutArr: ${millisImmArray}ms")

    InMemTablePrimaryKeys(immutableArray)
  }

  private def createSnapshot(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): Array[RowWithData] = {
    val length = primaryKeys.length
    val rowDataArray = new Array[RowWithData](length)
    var index = 0
    var count = 0

    while (index < length) {
      val key = primaryKeys.get(index)
      source.pullRow(key, vpColumns) match {
        case r: RowWithData =>
          rowDataArray(count) = r
          count += 1
        case _ =>
      }
      index += 1
    }

    if (count == length) rowDataArray else java.util.Arrays.copyOf(rowDataArray, count)
  }

  private def createKeyArray(snapshot: Array[RowWithData]): ImmutableArray[String] = {
    val keys = new Array[String](snapshot.length)
    var i = 0
    while (i < snapshot.length) {
      keys(i) = snapshot(i).key
      i += 1
    }
    ImmutableArray.from(keys)
  }

}
