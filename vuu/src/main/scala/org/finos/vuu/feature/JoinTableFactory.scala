package org.finos.vuu.feature

import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.provider.JoinTableProvider

trait JoinTableFactory {
  def createJoinTable(table: JoinTableDef, tableContainer: TableContainer, joinTableProvider: JoinTableProvider): DataTable
}
