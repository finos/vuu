package org.finos.vuu.feature.ignite.table

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.feature.TableFactory
import org.finos.vuu.provider.JoinTableProvider

class IgniteTableFactory extends TableFactory {
  override def createTable(tableDef: TableDef, joinTableProvider: JoinTableProvider): DataTable = ???
}
