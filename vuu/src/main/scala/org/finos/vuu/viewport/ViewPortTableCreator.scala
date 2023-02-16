package org.finos.vuu.viewport

import org.finos.vuu.api.{JoinSessionTableDef, SessionTableDef}
import org.finos.vuu.core.table.{JoinSessionTable, SessionTable, SimpleDataTable, SimpleSessionDataTable, TableContainer}
import org.finos.vuu.net.ClientSessionId

object ViewPortTableCreator {

  def create(table: RowSource, clientSession: ClientSessionId, groupBy: GroupBy, tableContainer: TableContainer): RowSource = {
    if (groupBy == NoGroupBy) {
      table.asTable match {
        case sessionTable: SimpleSessionDataTable =>
              assert(sessionTable.sessionId == clientSession, "Check session is valid")
              sessionTable
        case joinSessionTable: JoinSessionTable =>
          tableContainer.createJoinSessionTable(joinSessionTable.getTableDef.asInstanceOf[JoinSessionTableDef], clientSession)
        case simpleTable: SimpleDataTable if(table.asTable.getTableDef.isInstanceOf[SessionTableDef]) =>
          tableContainer.createSimpleSessionTable(simpleTable, clientSession)
        case _ =>
          table
      }
    } else {
        tableContainer.createTreeSessionTable(table, clientSession)
    }

  }

}
