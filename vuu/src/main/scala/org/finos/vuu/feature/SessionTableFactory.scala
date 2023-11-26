package org.finos.vuu.feature

import org.finos.vuu.api.{SessionTableDef, TableDef}
import org.finos.vuu.core.table.{DataTable, SessionTable}

trait SessionTableFactory {
  def createTable(tableDef: SessionTableDef): SessionTable
}
