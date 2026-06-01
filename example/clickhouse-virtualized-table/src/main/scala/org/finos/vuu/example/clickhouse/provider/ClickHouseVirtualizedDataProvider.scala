package org.finos.vuu.example.clickhouse.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.example.clickhouse.client.ClickHouseClient
import org.finos.vuu.example.clickhouse.provider.data.{ClickHouseRowDataProvider, ClickHouseTableSizeProvider}
import org.finos.vuu.example.clickhouse.provider.filter.{ClickHouseFilterFactory, ClickHouseFilterVisitor}
import org.finos.vuu.example.clickhouse.provider.sort.ClickHouseSortFactory
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}

import scala.collection.mutable.ListBuffer

class ClickHouseVirtualizedDataProvider(table: DataTable, client: ClickHouseClient)(implicit clock: Clock)
  extends VirtualizedProvider with StrictLogging {

  private val tableSizeProvider = ClickHouseTableSizeProvider(client)
  private val rowDataProvider = ClickHouseRowDataProvider(client)
  private val logAt = new LogAtFrequency(10_000)
  
  override def runOnce(viewPort: ViewPort): Unit = {
    logger.trace("[ClickHouseVirtualizedDataProvider] Starting runOnce")

    val range = viewPort.getRange
    val startIndex = Math.max(range.from - 500, 0)
    val limit = (range.to - startIndex) + 500
    val whereClause = ClickHouseFilterFactory.build(viewPort.filterSpec, table.getTableDef)
    val orderBy = ClickHouseSortFactory.build(viewPort.sortSpec, table.getTableDef)

    logger.trace(s"[ClickHouseVirtualizedDataProvider] Loading rows from ClickHouse range $startIndex to ${startIndex + limit} filter=$whereClause sort=$orderBy")

    val queryStart = clock.now()
    
    val tableSize = tableSizeProvider.getTableSize(table.name, whereClause)
    val rowsWithData = rowDataProvider.queryForRowData(table.name, viewPort.getColumns.getColumns, 
      whereClause, orderBy, limit, startIndex)
    
    val dataQueryMillis = clock.now() - queryStart

    logger.trace(s"[ClickHouseVirtualizedDataProvider] Updating session table")

    viewPort.table.asTable match {
      case tbl: VirtualizedSessionTable =>
        logger.trace("[ClickHouseVirtualizedDataProvider] Set Range")
        val (millisRange, _) = timeIt { tbl.setRange(VirtualizedRange(startIndex, startIndex + limit)) }

        logger.trace("[ClickHouseVirtualizedDataProvider] Set Size")
        val (millisSize, _) = timeIt { tbl.setSize(tableSize) }

        logger.trace("[ClickHouseVirtualizedDataProvider] Adding rows")
        val (millisRows, _) = timeIt {        
            var i = 0
            val n = rowsWithData.length
            while (i < n) {
              val rowWithData = rowsWithData(i)
              val tableIndex = startIndex + i
              tbl.processUpdateForIndex(
                tableIndex,
                rowWithData.key,
                rowWithData,
                clock.now()
              )
              i += 1
            }
        }

        logger.trace("[ClickHouseVirtualizedDataProvider] Getting Primary Keys")
        val (millisGetKeys, tableKeys) = timeIt { tbl.primaryKeys }

        logger.trace("[ClickHouseVirtualizedDataProvider] Setting Primary Keys")
        val (millisSetKeys, _) = timeIt { viewPort.setKeys(new VirtualizedViewPortKeys(tableKeys)) }

        if (logAt.shouldLog()) {
          logger.debug(
            s"[ClickHouseVirtualizedDataProvider] Complete runOnce dataQuery=$dataQueryMillis millisRange=$millisRange millisSize=$millisSize millisRows=$millisRows millisGetKeys=$millisGetKeys millisSetKeys=$millisSetKeys"
          )
        }
      case _ =>
        logger.warn("[ClickHouseVirtualizedDataProvider] Table is not a VirtualizedSessionTable")
    }
  }

  override def subscribe(key: String): Unit = {}
  override def doStart(): Unit = {}
  override def doStop(): Unit = {}
  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "org.finos.vuu.example.clickhouse.provider.ClickHouseVirtualizedDataProvider"

  override def getUniqueValues(columnName: String): Array[String] = Array.empty
  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] = Array.empty
  override def getUniqueValuesVPColumn(columnName: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys): Array[String] = Array.empty
  override def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys): Array[String] = Array.empty
}
