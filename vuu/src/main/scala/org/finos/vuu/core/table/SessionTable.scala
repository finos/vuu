package org.finos.vuu.core.table

import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.viewport.SessionListener
import org.finos.vuu.feature.spec.table.DataTable

trait SessionTable extends DataTable with SessionListener {
  def sessionId: ClientSessionId
  def delete(): Unit
}
