package org.finos.vuu.net.rpc.sessiontable

import org.finos.vuu.core.table.{DataTable, SessionTable, ViewPortColumnCreator}
import org.finos.vuu.net.rpc.sessiontable.SessionTableCopyOption.{All, Empty, Selected}
import org.finos.vuu.viewport.ViewPort

trait SessionTableDataExportProvider {

  def exportData(vp: ViewPort,
                 sessionTable: SessionTable,
                 columns: List[String],
                 copyOption: SessionTableCopyOption): Unit

}

class DefaultSessionTableDataExportProvider(dataTable: DataTable) extends SessionTableDataExportProvider {
  
  override def exportData(vp: ViewPort,
                          sessionTable: SessionTable,
                          columns: List[String],
                          copyOption: SessionTableCopyOption): Unit = {
    copyOption match {
      case All => copyData(vp.getKeys, sessionTable, columns)
      case Selected => copyData(vp.getSelection, sessionTable, columns)
      case Empty => //Nothing to do
    }
  }

  private def copyData(iterable: Iterable[String], sessionTable: SessionTable, columns: List[String]): Unit = {
    val vpColumns = ViewPortColumnCreator.create(dataTable, columns)
    val iterator = iterable.iterator.take(sessionTable.getTableDef.options.maxSize)
    while (iterator.hasNext) {
      val row = dataTable.pullRow(iterator.next(), vpColumns)
      sessionTable.processUpdate(row)
    }
  }

}
