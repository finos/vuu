package org.finos.vuu.table.virtualized

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.core.table.{SimpleSessionDataTable, TablePrimaryKeys}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.viewport.ViewPortRange

class VirtualizedSessionTable(clientSessionId: ClientSessionId, sessionTableDef: SessionTableDef, joinTableProvider: JoinTableProvider)(implicit metrics: MetricsProvider, clock: Clock) extends SimpleSessionDataTable(clientSessionId, sessionTableDef, joinTableProvider) {

  @volatile private var pendingRange: Option[VirtualizedRange] = None
  @volatile private var pendingData: Option[VirtualizedSessionTableData] = None

  @volatile private var theData: Option[VirtualizedSessionTableData] = None
  @volatile private var range: Option[VirtualizedRange] = None

  def withBatch(range: VirtualizedRange, block: (VirtualizedSessionTable) => Unit): Unit = {
    startBatch(range)
    block.apply(this)
    endBatch()
  }

  def startBatch(range: VirtualizedRange): Unit = {
    pendingRange = Some(range)
    pendingData = Some(new VirtualizedSessionTableData())
  }
  def endBatch(): Unit = {
    range = pendingRange
    pendingRange = None
    theData = pendingData
    pendingData = None
  }
  def length: Int = range match {
    case Some(r) => r.size
    case None => 0
  }

  override def primaryKeys: TablePrimaryKeys = super.primaryKeys
}