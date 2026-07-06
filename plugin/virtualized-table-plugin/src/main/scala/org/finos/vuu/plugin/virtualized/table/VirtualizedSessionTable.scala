package org.finos.vuu.plugin.virtualized.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.core.table.{ColumnValueProvider, InMemSessionDataTable, RowWithData, TableData}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.JoinTableProvider

class VirtualizedSessionTable(clientSessionId: ClientSessionId,
                              sessionTableDef: SessionTableDef,
                              joinTableProvider: JoinTableProvider,
                              val cacheSize: Int = 10_000)
                             (implicit metrics: MetricsProvider, clock: Clock) extends InMemSessionDataTable(clientSessionId, sessionTableDef, joinTableProvider) with StrictLogging {

  override def toString: String = s"VirtualizedSessionTable(tableDef=${sessionTableDef.name}, name=$name)"

  override protected def createDataTableData(): TableData = {
    new VirtualizedSessionTableData(cacheSize)
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
