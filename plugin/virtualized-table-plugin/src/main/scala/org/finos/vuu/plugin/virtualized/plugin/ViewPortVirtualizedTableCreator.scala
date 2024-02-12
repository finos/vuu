package org.finos.vuu.plugin.virtualized.plugin

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.feature.ViewPortTableCreator
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.plugin.virtualized.table.VirtualizedSessionTable
import org.finos.vuu.viewport.{GroupBy, RowSource}

object ViewPortVirtualizedTableCreator extends ViewPortTableCreator {

override def create(table: RowSource, clientSession: ClientSessionId, groupBy: GroupBy, tableContainer: TableContainer)(implicit metrics: MetricsProvider, clock: Clock): RowSource = {

    assert(table.asTable.getTableDef.isInstanceOf[VirtualizedSessionTableDef])

    val sessionTableDef = table.asTable.getTableDef.asInstanceOf[VirtualizedSessionTableDef]

    createSessionTable(clientSession, sessionTableDef, tableContainer)
  }

  private def createSessionTable(clientSession: ClientSessionId, sessionTableDef: VirtualizedSessionTableDef, tableContainer: TableContainer) (implicit metrics: MetricsProvider, clock: Clock) : RowSource= {
    val sessionTable = new VirtualizedSessionTable(clientSession, sessionTableDef, tableContainer.joinTableProvider, cacheSize = 20_000)

    val archetypeTable = tableContainer.getTable(sessionTableDef.name)
    val provider = archetypeTable.getProvider
    sessionTable.setProvider(provider)

    tableContainer.addTable(sessionTable)

    sessionTable
  }
}
