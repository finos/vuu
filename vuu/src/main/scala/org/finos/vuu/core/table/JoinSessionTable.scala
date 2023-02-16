package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.JoinTableProvider

class JoinSessionTable(val clientSessionId: ClientSessionId, tableDef: JoinTableDef, sourceTables: Map[String, DataTable], joinProvider: JoinTableProvider)(implicit metrics: MetricsProvider) extends JoinTable(tableDef, sourceTables, joinProvider) with SessionTable {
  override def sessionId: ClientSessionId = clientSessionId
  override def delete(): Unit = {}
}
