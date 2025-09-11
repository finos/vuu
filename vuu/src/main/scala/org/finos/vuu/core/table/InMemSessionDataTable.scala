package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.JoinTableProvider

class InMemSessionDataTable private (val clientSessionId: ClientSessionId,
                                     sessionTableDef: SessionTableDef,
                                     joinTableProvider: JoinTableProvider,
                                     final val creationTimestamp: Long)
                                    (implicit metrics: MetricsProvider, timeProvider: Clock) extends InMemDataTable(sessionTableDef, joinTableProvider) with SessionTable {

  def this(clientSessionId: ClientSessionId, sessionTableDef: SessionTableDef, joinTableProvider: JoinTableProvider)
          (implicit metrics: MetricsProvider, timeProvider: Clock) = {
    this(clientSessionId, sessionTableDef, joinTableProvider, creationTimestamp = timeProvider.now())
  }

  override def name: String = s"session:$clientSessionId/simple-" + sessionTableDef.name + "_" + creationTimestamp.toString

  override def sessionId: ClientSessionId = clientSessionId

  override def delete(): Unit = {
    data.deleteAll()
  }

  override def toString: String = s"InMemSessionDataTable($name, rows=${this.primaryKeys.length})"
}

