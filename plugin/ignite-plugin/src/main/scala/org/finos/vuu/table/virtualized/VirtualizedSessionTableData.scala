package org.finos.vuu.table.virtualized

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.table.{RowData, RowWithData, TableData, TablePrimaryKeys}

class VirtualizedSessionTableData extends TableData {

  private val primaryKeys: VirtualizedTableKeys = VirtualizedTableKeys(VirtualizedRange(0, 0, 0), Array())

  override def dataByKey(key: String): RowData = ???

  override def update(key: String, update: RowWithData): TableData = ???

  override def delete(key: String): TableData = ???

  override def deleteAll(): TableData = ???
  override def primaryKeyValues: TablePrimaryKeys = ???
}
