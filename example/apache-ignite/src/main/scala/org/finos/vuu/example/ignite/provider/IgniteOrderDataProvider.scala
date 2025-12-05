package org.finos.vuu.example.ignite.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.example.ignite.module.IgniteOrderDataModule
import org.finos.vuu.example.ignite.provider.IgniteOrderDataProvider.columnNameByExternalField
import org.finos.vuu.example.ignite.query.IndexCalculator
import org.finos.vuu.example.ignite.schema.ChildOrderSchema
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.feature.ignite.IgniteSqlQuery
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.util.schema.SchemaMapperBuilder
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}

import java.util.concurrent.atomic.AtomicInteger

class IgniteOrderDataProvider(final val igniteStore: IgniteOrderStore)
                             (implicit clock: Clock) extends VirtualizedProvider with StrictLogging {

  private val schemaMapper = SchemaMapperBuilder(ChildOrderSchema.schema, IgniteOrderDataModule.columns)
    .withFieldsMap(columnNameByExternalField)
    .build()
  private val dataQuery = IgniteOrderDataQuery(igniteStore, schemaMapper)
  private val indexCalculator = IndexCalculator(extraRowsCount = 5000)

  override def runOnce(viewPort: ViewPort): Unit = {

    val internalTable = viewPort.table.asTable.asInstanceOf[VirtualizedSessionTable]

    val igniteFilter =  dataQuery.getFilterSql(viewPort.filterSpec)
    val totalSize: Int = getTotalSize(igniteFilter).toInt

    val viewPortRange = viewPort.getRange
    logger.debug(s"Calculating index for view port range ${viewPortRange.from} and ${viewPortRange.to} for total rows of $totalSize")
    val (startIndex, endIndex, rowCount) = indexCalculator.calc(viewPortRange, totalSize)

    internalTable.setSize(totalSize)//todo should this be long?
    internalTable.setRange(VirtualizedRange(startIndex, endIndex))

    logger.debug(s"Loading data between $startIndex and $endIndex for $rowCount rows where total size $totalSize")

    val index = new AtomicInteger(startIndex) // todo: get rid of working assumption here that the dataset is fairly immutable.
    def updateTableRowAtIndex = tableUpdater(internalTable)
    dataQuery
      .fetch(viewPort.filterSpec, viewPort.sortSpec, startIndex = startIndex, rowCount = rowCount)
      .map(schemaMapper.toInternalRowMap)
      .foreach(updateTableRowAtIndex(index.getAndIncrement(), _))

    logger.debug(s"Updated ${index.get() - startIndex} table rows")

    viewPort.setKeys(new VirtualizedViewPortKeys(internalTable.primaryKeys))
  }

  private def getTotalSize(filterSql: IgniteSqlQuery): Long = igniteStore.getCount(filterSql)

  private def tableUpdater(table: VirtualizedSessionTable): (Int, Map[String, Any]) => Unit = {
    val keyField = table.tableDef.keyField

    (idx, rowMap) => {
      val newRow = RowWithData(rowMap(keyField).toString, rowMap)
      if (table.hasRowChangedAtIndex(idx, newRow)) table.processUpdateForIndex(idx, newRow.key, newRow, clock.now())
    }
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "org.finos.vuu.example.ignite.provider.IgniteOrderDataProvider"

  override def getUniqueValues(columnName: String): Array[String] =
    igniteStore.getDistinct(columnName, 10).toArray

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] =
    igniteStore.getDistinct(columnName, starts, 10).toArray

  override def getUniqueValuesVPColumn(columnName: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys): Array[String] = ???

  override def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys): Array[String] = ???
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
