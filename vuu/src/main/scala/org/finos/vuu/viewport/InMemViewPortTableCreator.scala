package org.finos.vuu.viewport

import io.vertx.core.spi.metrics.Metrics
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.core.table.{InMemDataTable, InMemSessionDataTable, SessionTable, TableContainer}
import org.finos.vuu.feature.ViewPortTableCreator
import org.finos.vuu.net.ClientSessionId

object InMemViewPortTableCreator extends ViewPortTableCreator {

  def create(table: RowSource, clientSession: ClientSessionId, groupBy: GroupBy, tableContainer: TableContainer)(implicit metrics: MetricsProvider, clock: Clock): RowSource = {
    if (groupBy == NoGroupBy) {
      table.asTable match {
        case sessionTable: InMemSessionDataTable =>
              assert(sessionTable.sessionId == clientSession, "Check session is valid")
              sessionTable
        case simpleTable: InMemDataTable if(table.asTable.getTableDef.isInstanceOf[SessionTableDef]) =>
          tableContainer.createSimpleSessionTable(simpleTable, clientSession)
        case _ =>
          table
      }
    } else {
        tableContainer.createTreeSessionTable(table, clientSession)
    }

  }

}
