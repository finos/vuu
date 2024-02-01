package org.finos.vuu.example.ignite.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.feature.ignite.schema.SchemaMapper
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.ViewPort

import java.util.concurrent.atomic.AtomicInteger

class IgniteOrderDataProvider(final val igniteStore: IgniteOrderStore, final val schemaMapper: SchemaMapper)
                             (implicit clock: Clock) extends VirtualizedProvider with StrictLogging {

  private val extraRowsCount = 5000 //fetch extra rows to reduce need to re-fetch when view port change by small amount
  private val dataQuery = IgniteOrderDataQuery(igniteStore, schemaMapper)

  override def runOnce(viewPort: ViewPort): Unit = {

    val internalTable = viewPort.table.asTable.asInstanceOf[VirtualizedSessionTable]

    val range = viewPort.getRange
    val totalSize = igniteStore.childOrderCount().toInt

    internalTable.setSize(totalSize)

    val startIndex = Math.max(range.from - extraRowsCount, 0)
    val endIndex = range.to + extraRowsCount
    val rowCount = if (endIndex > startIndex) endIndex - startIndex else 1

    internalTable.setRange(VirtualizedRange(startIndex, endIndex))

    val index = new AtomicInteger(startIndex) // todo: get rid of working assumption here that the dataset is fairly immutable.

    logger.info(s"Loading data between $startIndex and $endIndex")
    dataQuery
      .fetch(viewPort.filterSpec, viewPort.sortSpecInternal, startIndex = startIndex, rowCount = rowCount)
      .map(dataQuery.toInternalRow(internalTable.tableDef.keyField))
      .foreach(rowData => processUpdateForIndex(internalTable)(index.getAndIncrement(), rowData))

    viewPort.setKeys(new VirtualizedViewPortKeys(internalTable.primaryKeys))
  }

  private def processUpdateForIndex(internalTable: VirtualizedSessionTable): (Int, IgniteOrderDataQuery.RowKeyAndData) => Unit = {
    case (index, (key, rowData)) => internalTable.processUpdateForIndex(index, key, RowWithData(key, rowData), clock.now())
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "org.finos.vuu.example.ignite.provider.IgniteOrderDataProvider"
}
