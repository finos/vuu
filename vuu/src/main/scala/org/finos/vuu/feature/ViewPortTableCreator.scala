package org.finos.vuu.feature

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.viewport.{GroupBy, RowSource}

trait ViewPortTableCreator{
  def create(table: RowSource, clientSession: ClientSessionId, groupBy: GroupBy, tableContainer: TableContainer)(implicit metrics: MetricsProvider, clock: Clock): RowSource
}
