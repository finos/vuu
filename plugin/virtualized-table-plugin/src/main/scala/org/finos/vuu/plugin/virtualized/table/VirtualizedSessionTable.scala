package org.finos.vuu.plugin.virtualized.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{ColumnValueProvider, InMemSessionDataTable, RowWithData, TableData}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.viewport.{EmptyRange, ViewPort, ViewPortRange}

class VirtualizedSessionTable(clientSessionId: ClientSessionId,
                              virtualizedSessionTableDef: VirtualizedSessionTableDef,
                              joinTableProvider: JoinTableProvider,
                              val cacheSize: Int = 10_000)
                             (implicit metrics: MetricsProvider, clock: Clock) extends InMemSessionDataTable(clientSessionId, virtualizedSessionTableDef, joinTableProvider) with StrictLogging {

  @volatile private var nextRefreshTime: Long = 0
  @volatile private var lastViewPortHash: Int = 0
  @volatile private var lastViewPortRange: ViewPortRange = EmptyRange
    
  override def toString: String = s"VirtualizedSessionTable(tableDef=${virtualizedSessionTableDef.name}, name=$name)"

  override protected def createDataTableData(): TableData = {
    new VirtualizedSessionTableData(cacheSize)
  }

  override def getTableDef: VirtualizedSessionTableDef = virtualizedSessionTableDef

  def finishRefresh(viewPortHash: Int, viewPortRange: ViewPortRange, nextRefresh: Long): Unit = {
    lastViewPortHash = viewPortHash
    lastViewPortRange = viewPortRange
    nextRefreshTime = nextRefresh
  }

  def needsRefresh(viewPort: ViewPort): Boolean = {
    viewPort.getStructuralHashCode() != lastViewPortHash ||
      viewPort.getRange != lastViewPortRange ||
      nextRefreshTime <= clock.now()
  }
  
  def processUpdateForIndex(index: Int, rowKey: String, rowData: RowWithData, timeStamp: Long): Unit = {
    if (isWithinRange(index) && hasRowChangedAtIndex(index, rowData)){
      data.setKeyAt(index, rowKey)
      super.processUpdate(rowKey, rowData)
    }
  }

  def processDeleteForIndex(index: Int, rowKey: String, timeStamp: Long): Unit = {
    //TODO
  }

  def hasRowChangedAtIndex(index: Int, row: RowWithData): Boolean = {
    val existingKeyAtIndex = this.primaryKeys.get(index)
    val existingRow = this.pullRow(existingKeyAtIndex)
    !existingRow.equals(row)
  }

  def setSize(size: Int): Unit = {
    this.data match {
      case virtData: VirtualizedSessionTableData => virtData.setLength(size)
      case _ =>
        logger.error("Trying to set range on non-virtualized data, something has gone bad.")
    }
  }

  def setRange(from: Int, to: Int): Unit = {
    this.data match {
      case virtData: VirtualizedSessionTableData => virtData.setRangeForKeys(from, to)
      case _ =>
        logger.error("Trying to set range on non-virtualized data, something has gone bad.")
    }
  }

  override def getColumnValueProvider: ColumnValueProvider =
    this.getProvider.asInstanceOf[ColumnValueProvider]

  def isWithinRange(index: Int): Boolean = {
    this.data match {
      case virtData: VirtualizedSessionTableData => virtData.isWithinRange(index)
      case _ =>
        logger.error("Trying to check range on non-virtualized data, something has gone bad.")
        false
    }
  }

  
}
