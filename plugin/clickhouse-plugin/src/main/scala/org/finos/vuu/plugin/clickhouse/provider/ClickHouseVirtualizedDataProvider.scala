package org.finos.vuu.plugin.clickhouse.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.provider.data.{ClickHouseRowDataProvider, ClickHouseTableSizeProvider}
import org.finos.vuu.plugin.clickhouse.provider.filter.ClickHouseFilterFactory
import org.finos.vuu.plugin.clickhouse.provider.sort.ClickHouseSortFactory
import org.finos.vuu.plugin.virtualized.api.{VirtualizedSessionTableColumn, VirtualizedSessionTableDef}
import org.finos.vuu.plugin.virtualized.table.{VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}

class ClickHouseVirtualizedDataProvider(tableDef: VirtualizedSessionTableDef, client: ClickHouseClient)(using clock: Clock)
  extends VirtualizedProvider with StrictLogging {

  private val tableSizeProvider = ClickHouseTableSizeProvider(client)
  private val rowDataProvider = ClickHouseRowDataProvider(client)
  private val logAt = new LogAtFrequency(10_000)

  override def runOnce(viewPort: ViewPort): Unit = {
    logger.trace("[ClickHouseVirtualizedDataProvider] Starting runOnce")

    val range = viewPort.getRange
    val startIndex = Math.max(range.from - 500, 0)
    val limit = (range.to - startIndex) + 500

    val columns = viewPort.getColumns.getColumns
      .filter(f => f.isInstanceOf[VirtualizedSessionTableColumn])
      .map(_.asInstanceOf[VirtualizedSessionTableColumn])

    val whereClause = ClickHouseFilterFactory.build(columns, viewPort.filterSpec)
    val orderBy = ClickHouseSortFactory.build(tableDef, columns, viewPort.sortSpec)

    logger.trace(s"[ClickHouseVirtualizedDataProvider] Loading rows from ClickHouse range $startIndex to ${startIndex + limit} filter=$whereClause sort=$orderBy")

    val queryStart = clock.now()
    val tableSize = tableSizeProvider.getTableSize(tableDef, whereClause)
    val rowsWithData = rowDataProvider.queryForRowData(tableDef, columns,
      whereClause, orderBy, limit, startIndex)
    val dataQueryMillis = clock.now() - queryStart

    logger.trace(s"[ClickHouseVirtualizedDataProvider] Updating session table")

    viewPort.table.asTable match {
      case tbl: VirtualizedSessionTable =>

        logger.trace(s"[ClickHouseVirtualizedDataProvider] Setting range to $startIndex -> ${startIndex + limit}")
        val (millisRange, _) = timeIt { tbl.setRange(startIndex, startIndex + limit) }

        logger.trace(s"[ClickHouseVirtualizedDataProvider] Setting table size to $tableSize")
        val (millisSize, _) = timeIt { tbl.setSize(tableSize) }

        logger.trace(s"[ClickHouseVirtualizedDataProvider] Adding ${rowsWithData.length} rows")
        val (millisRows, _) = timeIt {
          val n = rowsWithData.length
          val now = clock.now()

          var i = 0
          while (i < n) {
            val rowWithData = rowsWithData(i)
            val tableIndex = startIndex + i
            logger.trace(s"Publishing update for $rowWithData to index $tableIndex")
            tbl.processUpdateForIndex(
              tableIndex,
              rowWithData.key,
              rowWithData,
              now
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

  override val lifecycleId: String = s"ClickHouseVirtualizedDataProvider@$hashCode"

  override def getUniqueValues(columnName: String): Array[String] = Array.empty
  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] = Array.empty
  override def getUniqueValuesVPColumn(columnName: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys): Array[String] = Array.empty
  override def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPortColumns: ViewPortColumns, vpKeys: ViewPortKeys): Array[String] = Array.empty
}
