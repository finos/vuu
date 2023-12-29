package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.JoinTableProvider

class InMemSessionDataTable(val clientSessionId: ClientSessionId, sessionTableDef: SessionTableDef, joinTableProvider: JoinTableProvider)(implicit metrics: MetricsProvider, clock: Clock) extends InMemDataTable(sessionTableDef, joinTableProvider)(metrics) with SessionTable {

  final val createInstant = clock.now()
  override def name: String = s"session:$clientSessionId/simple-" + sessionTableDef.name + "_" + createInstant.toString
  def tableId: String = name + "@" + hashCode()

  override def sessionId: ClientSessionId = clientSessionId

  override def delete(): Unit = {
    data.deleteAll()
  }

  override def toString: String = s"InMemSessionDataTable($name, rows=${this.primaryKeys.length})"
}

