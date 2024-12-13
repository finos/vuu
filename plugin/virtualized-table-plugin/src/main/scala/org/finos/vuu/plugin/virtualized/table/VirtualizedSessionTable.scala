package org.finos.vuu.plugin.virtualized.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.core.table.{ColumnValueProvider, InMemSessionDataTable, RowData, RowWithData, TableData, TablePrimaryKeys}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.{JoinTableProvider, VirtualizedProvider}

class VirtualizedSessionTable(clientSessionId: ClientSessionId,
                              sessionTableDef: SessionTableDef,
                              joinTableProvider: JoinTableProvider,
                              val cacheSize: Int = 10_000)
                             (implicit metrics: MetricsProvider, clock: Clock) extends InMemSessionDataTable(clientSessionId, sessionTableDef, joinTableProvider) with StrictLogging {

  @volatile private var dataSetSize: Int = 0
  @volatile private var range = VirtualizedRange(0, 0)

  override def toString: String = s"VirtualizedSessionTable(tableDef=${sessionTableDef.name}, name=$name)"

  override def primaryKeys: TablePrimaryKeys = super.primaryKeys

  override protected def createDataTableData(): TableData = {
    new VirtualizedSessionTableData(cacheSize)
  }

  def processUpdateForIndex(index: Int, rowKey: String, rowData: RowWithData, timeStamp: Long): Unit = {
    if(isInCurrentRange(index)){
      data.setKeyAt(index, rowKey)
      super.processUpdate(rowKey, rowData, timeStamp)
    }
  }

  def processDeleteForIndex(index: Int, rowKey: String, rowData: RowWithData, timeStamp: Long): Unit = {
    super.processUpdate(rowKey, rowData, timeStamp)
  }

  def hasRowChangedAtIndex(index: Int, row: RowWithData): Boolean = {
    val existingKeyAtIndex = this.primaryKeys.get(index)
    val existingRow = this.pullRow(existingKeyAtIndex)
    !existingRow.equals(row)
  }

  /**
   * Set the total data set size after gathering the results.
   *
   * @param size
   */
  def setSize(size: Int): Unit = {
    dataSetSize = size
    this.data match {
      case virtData: VirtualizedSessionTableData => virtData.setLength(size)
      case _ =>
        logger.error("Trying to set range on non-virtualized data, something has gone bad.")
    }
  }
  override def processUpdate(rowKey: String, rowData: RowData, timeStamp: Long): Unit = super.processUpdate(rowKey, rowData, timeStamp)

  override def processDelete(rowKey: String): Unit = super.processDelete(rowKey)

  override def getColumnValueProvider: ColumnValueProvider =
    this.getProvider.asInstanceOf[ColumnValueProvider]

  def setRange(range: VirtualizedRange): Unit = {
    this.range = range
    this.data match {
      case virtData: VirtualizedSessionTableData => virtData.setRangeForKeys(range)
      case _ =>
        logger.error("Trying to set range on non-virtualized data, something has gone bad.")
    }
  }

  private def isInCurrentRange(index: Int): Boolean = {
      range.contains(index)
  }

}