package org.finos.vuu.feature.ignite.table

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.InMemSessionDataTable
import org.finos.vuu.feature.ignite.api.IgniteSessionTableDef
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.JoinTableProvider

class IgniteVirtualizedSessionTable(clientSessionId: ClientSessionId, sessionTableDef: IgniteSessionTableDef, joinTableProvider: JoinTableProvider)(implicit metrics: MetricsProvider, clock: Clock) extends InMemSessionDataTable(clientSessionId, sessionTableDef, joinTableProvider)(metrics, clock) {


}
