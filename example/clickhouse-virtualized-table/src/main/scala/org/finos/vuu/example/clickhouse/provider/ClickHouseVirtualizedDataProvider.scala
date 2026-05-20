package org.finos.vuu.example.clickhouse.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.example.clickhouse.client.ClickHouseClient
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}
import scala.collection.mutable.ListBuffer

class ClickHouseVirtualizedDataProvider(client: ClickHouseClient)(implicit clock: Clock)
  extends VirtualizedProvider with StrictLogging {

  private val logAt = new LogAtFrequency(10_000)

  override def runOnce(viewPort: ViewPort): Unit = {
    logger.trace("[ClickHouseVirtualizedDataProvider] Starting runOnce")

    val range = viewPort.getRange

    // typically get a larger range of data for efficiency (e.g. padding by 500)
    val startIndex = Math.max((range.from - 500), 0)
    val limit = (range.to - startIndex) + 500

    logger.trace(s"[ClickHouseVirtualizedDataProvider] Loading orders from ClickHouse range $startIndex to ${startIndex + limit}")

    // Get total size of orders
    val totalSize = client.executeQuery("SELECT count() as cnt FROM orders") { rs =>
      if (rs.next()) rs.getInt("cnt") else 0
    }

    // Load orders in the current range
    val orders = client.executeQuery(
      s"SELECT orderId, quantity, price, side, trader FROM orders ORDER BY orderId LIMIT $limit OFFSET $startIndex"
    ) { rs =>
      val buffer = ListBuffer[(Int, (Long, Int, Long, String, String))]()
      var index = startIndex
      while (rs.next()) {
        val orderId = rs.getLong("orderId")
        val quantity = rs.getInt("quantity")
        val price = rs.getLong("price")
        val side = rs.getString("side")
        val trader = rs.getString("trader")
        buffer.append((index, (orderId, quantity, price, side, trader)))
        index += 1
      }
      buffer.toList
    }

    viewPort.table.asTable match {
      case tbl: VirtualizedSessionTable =>
        logger.trace("[ClickHouseVirtualizedDataProvider] Set Range")
        val (millisRange, _) = timeIt { tbl.setRange(VirtualizedRange(startIndex, startIndex + limit)) }

        logger.trace("[ClickHouseVirtualizedDataProvider] Set Size")
        val (millisSize, _) = timeIt { tbl.setSize(totalSize) }

        logger.trace("[ClickHouseVirtualizedDataProvider] Adding rows")
        val (millisRows, _) = timeIt {
          orders.foreach { case (index, (orderId, quantity, price, side, trader)) =>
            val rowWithData = RowWithData(
              orderId.toString,
              Map(
                "orderId" -> orderId.toString,
                "quantity" -> java.lang.Integer.valueOf(quantity),
                "price" -> java.lang.Long.valueOf(price),
                "side" -> side,
                "trader" -> trader
              )
            )
            tbl.processUpdateForIndex(index, orderId.toString, rowWithData, clock.now())
          }
        }

        logger.trace("[ClickHouseVirtualizedDataProvider] Getting Primary Keys")
        val (millisGetKeys, tableKeys) = timeIt { tbl.primaryKeys }

        logger.trace("[ClickHouseVirtualizedDataProvider] Setting Primary Keys")
        val (millisSetKeys, _) = timeIt { viewPort.setKeys(new VirtualizedViewPortKeys(tableKeys)) }

        if (logAt.shouldLog()) {
          logger.debug(
            s"[ClickHouseVirtualizedDataProvider] Complete runOnce millisRange = $millisRange millisSize=$millisSize millisRows=$millisRows millisGetKeys=$millisGetKeys millisSetKeys=$millisSetKeys"
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
