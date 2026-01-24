package org.finos.vuu.plugin.offheap.table

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{RowData, TableData, TablePrimaryKeys}

class OffHeapTableData(private val tableDef: TableDef) extends TableData {

  override def dataByKey(key: String): RowData = ???

  override def update(key: String, update: RowData): (TableData, RowData) = ???

  override def delete(key: String): TableData = ???

  override def deleteAll(): TableData = ???

  override def primaryKeyValues: TablePrimaryKeys = ???

  override def setKeyAt(index: Int, key: String): Unit = ???
}
