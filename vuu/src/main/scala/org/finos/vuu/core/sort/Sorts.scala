package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.core.table.{Column, RowData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.net.SortSpec
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

import java.util
import java.util.Comparator

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

  override def doSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {

    logger.trace("Starting map")

    val (millisToArray, snapshot) = timeIt {
      primaryKeys.toArray.map(key => source.pullRow(key, vpColumns))
    }

    logger.trace("Starting sort")

    val (millisSort, _ ) = timeIt {

      util.Arrays.sort(snapshot, (o1: RowData, o2: RowData) => {
        SortCompares.compare(o1, o2, columns, sortDirections, 0)
      })
    }

    logger.trace("Starting build imm arr")

    val (millisImmArray, immutableArray) = timeIt {

      val snapshotKeys = new Array[String](snapshot.length)

      snapshot.indices.foreach { i =>
        snapshotKeys(i) = snapshot(i).key
      }

      ImmutableArray.fromArray(snapshotKeys)
    }

    logger.debug(s"[SORT]: Table Size: ${primaryKeys.length} DataToArray: ${millisToArray}ms, Sort: ${millisSort}ms, ImmutArr: ${millisImmArray}ms")

    InMemTablePrimaryKeys(immutableArray)
  }
}
