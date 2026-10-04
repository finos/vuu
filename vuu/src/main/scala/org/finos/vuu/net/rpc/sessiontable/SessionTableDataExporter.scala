package org.finos.vuu.net.rpc.sessiontable

import org.finos.vuu.core.table.InMemSessionDataTable
import org.finos.vuu.viewport.ViewPort

trait SessionTableDataExporter {
  def exportData(copyOption: SessionTableCopyOption, vp: ViewPort, sessionTable: InMemSessionDataTable, columns: List[String]): Unit
}
