package org.finos.vuu.feature

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.provider.JoinTableProvider

trait TableFactory {
    def createTable(tableDef: TableDef, tableContainer: TableContainer, joinTableProvider: JoinTableProvider): DataTable
}
