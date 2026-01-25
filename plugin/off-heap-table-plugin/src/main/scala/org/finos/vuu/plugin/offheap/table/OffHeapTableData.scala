package org.finos.vuu.plugin.offheap.table

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{RowData, TableData, TablePrimaryKeys}

import java.util.concurrent.ConcurrentHashMap

class OffHeapTableData(private val tableDef: TableDef) extends TableData {

  private final val keyToIndexMap = ConcurrentHashMap[String, Long]()

  override def dataByKey(key: String): RowData = {
    keyToIndexMap.get(key) match {
      case index: Int => ???
      case _ => null
    }
  }

  override def update(key: String, update: RowData): (TableData, RowData) = ???

  override def delete(key: String): TableData = ???

  override def deleteAll(): TableData = ???

  override def primaryKeyValues: TablePrimaryKeys =

  override def setKeyAt(index: Int, key: String): Unit = ???
}
