package org.finos.vuu.example.ignite.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.feature.ignite.filter.{IgniteSqlFilterClause, IgniteSqlFilterTreeVisitor}
import org.finos.vuu.feature.ignite.sort.IgniteSqlSortBuilder
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.ViewPort

import java.util.concurrent.atomic.AtomicInteger

class IgniteOrderDataProvider(final val igniteStore: IgniteOrderStore)(implicit clock: Clock) extends VirtualizedProvider with StrictLogging {

  private val extraRowsCount = 5000 //fetch extra rows to reduce need to re-fetch when view port change by small amount

  override def runOnce(viewPort: ViewPort): Unit = {

    val internalTable = viewPort.table.asTable.asInstanceOf[VirtualizedSessionTable]

    val range = viewPort.getRange
    val totalSize = igniteStore.childOrderCount().toInt

    internalTable.setSize(totalSize)

    val sqlFilterClause =
      if (viewPort.filterSpec.filter == null || viewPort.filterSpec.filter.isEmpty) {
        ""
      }
      else {
        val filterTreeVisitor = new IgniteSqlFilterTreeVisitor
        val clause = FilterSpecParser.parse[IgniteSqlFilterClause](viewPort.filterSpec.filter, filterTreeVisitor)
        clause.toSql(internalTable.getTableDef)
      }

    val startIndex = Math.max(range.from - extraRowsCount, 0)
    val endIndex = range.to + extraRowsCount
    val rowCount = if (endIndex > startIndex) endIndex - startIndex else 1

    internalTable.setRange(VirtualizedRange(startIndex, endIndex))

    val sortBuilder = new IgniteSqlSortBuilder
    val sqlSortQueries = sortBuilder.toSql(viewPort.sortSpecInternal, tableColumn => ColumnMap.toIgniteColumn(tableColumn))

    logger.info(s"Loading data between $startIndex and $endIndex")

    val iterator = igniteStore.findChildOrder(sqlFilterQueries = sqlFilterClause, sqlSortQueries = sqlSortQueries, rowCount = rowCount, startIndex = startIndex)

    logger.info(s"Loaded data between $startIndex and $endIndex")

    val index = new AtomicInteger(startIndex) // todo: get rid of working assumption here that the dataset is fairly immutable.

    iterator.foreach(childOrder => {
      val row = RowWithData(childOrder.id.toString,
        Map(
          "orderId" -> childOrder.id,
          "ric" -> childOrder.ric,
          "price" -> childOrder.price,
          "quantity" -> childOrder.quantity,
          "side" -> childOrder.side,
          "strategy" -> childOrder.strategy,
          "parentOrderId" -> childOrder.parentId
        ))
      internalTable.processUpdateForIndex(index.getAndIncrement(), childOrder.id.toString, row, clock.now())
    })
    viewPort.setKeys(new VirtualizedViewPortKeys(internalTable.primaryKeys))
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "org.finos.vuu.example.ignite.provider.IgniteOrderDataProvider"
}

object ColumnMap {

  private type TableToIgniteColumns = Map[String, String]

  private val orderMap : TableToIgniteColumns =  Map(
    "orderId" -> "id",
    "ric" -> "ric",
    "price" -> "price",
    "quantity" -> "quantity",
    "side" -> "side",
    "strategy" -> "strategy",
    "parentOrderId" -> "parentId",
  )
  def toIgniteColumn(tableColumn: String): Option[String] =
    orderMap.get(tableColumn)

}
