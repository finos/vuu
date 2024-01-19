package org.finos.vuu.example.virtualtable.provider

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.data.order.ignite.IgniteOrderStore
import org.finos.vuu.feature.ignite.filter.{IgniteSqlFilterClause, IgniteSqlFilterTreeVisitor}
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.ViewPort

import java.util.concurrent.atomic.AtomicInteger

class IgniteOrderDataProvider(final val igniteStore: IgniteOrderStore)(implicit clock: Clock) extends VirtualizedProvider {

  override def runOnce(viewPort: ViewPort): Unit = {

    val internalTable = viewPort.table.asTable.asInstanceOf[VirtualizedSessionTable]

    val range = viewPort.getRange
    val totalSize = igniteStore.childOrderCount().toInt

    internalTable.setSize(totalSize)
    internalTable.setRange(VirtualizedRange(range.from, range.to))


//    val sqlFilterClause =
//      if (viewPort.filterSpec.filter == null || viewPort.filterSpec.filter.isEmpty) {
//        ""
//      }
//      else {
//        val filterTreeVisitor = new IgniteSqlFilterTreeVisitor
//        val clause = FilterSpecParser.parse[IgniteSqlFilterClause](viewPort.filterSpec.filter, filterTreeVisitor)
//        clause.toSql()
//      }

    val sqlFilterClause = ""

    val rowCount = if(range.to > range.from) range.to - range.from else 1
    val iterator = igniteStore.findChildOrder(sqlFilterClause = sqlFilterClause, startIndex = range.from, rowCount = rowCount)

   // val iterator = igniteStore.findWindow(range.from, rowCount)

    val index = new AtomicInteger(range.from) // todo: get rid of working assumption here that the dataset is fairly immutable.
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

  override val lifecycleId: String = "org.finos.vuu.example.virtualtable.provider.IgniteOrderDataProvider"
}
