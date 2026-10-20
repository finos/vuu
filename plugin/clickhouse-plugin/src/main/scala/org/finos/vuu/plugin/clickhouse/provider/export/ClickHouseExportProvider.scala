package org.finos.vuu.plugin.clickhouse.provider.`export`

import org.finos.vuu.core.table.SessionTable
import org.finos.vuu.net.rpc.sessiontable.{SessionTableCopyOption, SessionTableDataExportProvider}
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.viewport.ViewPort

class ClickHouseExportProvider(tableDef: VirtualizedSessionTableDef) extends SessionTableDataExportProvider {

  override def exportData(vp: ViewPort,
                          sessionTable: SessionTable,
                          columns: List[String],
                          copyOption: SessionTableCopyOption): Unit = {

    //get data for current vp

    //copy into the session table

  }
}
