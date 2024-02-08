package org.finos.vuu.example.ignite.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.example.ignite.module.IgniteOrderDataModule
import org.finos.vuu.example.ignite.provider.IgniteOrderDataProvider.columnNameByExternalField
import org.finos.vuu.example.ignite.query.IndexCalculator
import org.finos.vuu.example.ignite.schema.IgniteChildOrderEntity
import org.finos.vuu.feature.ignite.schema.SchemaMapper
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.{ViewPort, ViewPortRange}

import java.util.concurrent.atomic.AtomicInteger

class IgniteOrderDataProvider(final val igniteStore: IgniteOrderStore)
                             (implicit clock: Clock) extends VirtualizedProvider with StrictLogging {

  private val schemaMapper = SchemaMapper(IgniteChildOrderEntity.getSchema, IgniteOrderDataModule.columns, columnNameByExternalField)
  private val dataQuery = IgniteOrderDataQuery(igniteStore, schemaMapper)
  private val indexCalculator = IndexCalculator(extraRowsCount = 5000)

  override def runOnce(viewPort: ViewPort): Unit = {

    val internalTable = viewPort.table.asTable.asInstanceOf[VirtualizedSessionTable]

    val totalSize = igniteStore.childOrderCount().toInt

    val (startIndex, endIndex, rowCount) = indexCalculator.calc(viewPort.getRange, totalSize)

    internalTable.setSize(totalSize)//todo should this be long?
    internalTable.setRange(VirtualizedRange(startIndex, endIndex))

    logger.info(s"Loading data between $startIndex and $endIndex")

    val index = new AtomicInteger(startIndex) // todo: get rid of working assumption here that the dataset is fairly immutable.
    def toTableRow = dataQuery.toInternalRow(internalTable.tableDef.keyField)
    def updateTableRowAtIndex = tableUpdater(internalTable)
    dataQuery
      .fetch(viewPort.filterSpec, viewPort.sortSpecInternal, startIndex = startIndex, rowCount = rowCount)
      .map(toTableRow)
      .foreach(rowData => updateTableRowAtIndex(index.getAndIncrement(), rowData))

    logger.info(s"Updated ${index.get() - startIndex} table rows")

    viewPort.setKeys(new VirtualizedViewPortKeys(internalTable.primaryKeys))
  }

  private def tableUpdater(internalTable: VirtualizedSessionTable): (Int, IgniteOrderDataQuery.RowKeyAndData) => Unit = {
    case (index, (key, rowData)) => internalTable.processUpdateForIndex(index, key, RowWithData(key, rowData), clock.now())
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "org.finos.vuu.example.ignite.provider.IgniteOrderDataProvider"
}

object IgniteOrderDataProvider {
  val columnNameByExternalField: Map[String, String] = Map(
    "id" -> "orderId",
    "ric" -> "ric",
    "price" -> "price",
    "quantity" -> "quantity",
    "side" -> "side",
    "strategy" -> "strategy",
    "parentId" -> "parentId",
  )
}
