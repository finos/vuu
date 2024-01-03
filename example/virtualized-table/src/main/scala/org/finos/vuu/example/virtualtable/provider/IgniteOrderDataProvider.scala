package org.finos.vuu.example.virtualtable.provider

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.data.order.ignite.IgniteOrderStore
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.ViewPort

import java.util.concurrent.atomic.AtomicInteger

class IgniteOrderDataProvider(final val table: DataTable,
                              final val igniteStore: IgniteOrderStore)(implicit clock: Clock) extends VirtualizedProvider {
  private final val internalTable = table.asInstanceOf[VirtualizedSessionTable]

  override def runOnce(viewPort: ViewPort): Unit = {

    val range = viewPort.getRange
    val totalSize = igniteStore.childOrderCount().toInt

    internalTable.setSize(totalSize)
    internalTable.setRange(VirtualizedRange(range.from, range.to))
    val iterator = igniteStore.findWindow(range.from, range.to)
    val index = new AtomicInteger(range.from) // todo: get rid of working assumption here that the dataset is fairly immutable.
    iterator.foreach(childOrder => {
      val row = RowWithData(childOrder.id.toString,
        Map(
          "orderId" -> childOrder.id,
          "price" -> childOrder.price,
          "quantity" -> childOrder.exchange,
          "side" -> childOrder.side,
          "trader" -> "N/A"
        ))
      internalTable.processUpdateForIndex(index.getAndIncrement(), childOrder.id.toString, row, clock.now())
    })
  }

  override def subscribe(key: String): Unit = ???

  override def doStart(): Unit = ???

  override def doStop(): Unit = ???

  override def doInitialize(): Unit = ???

  override def doDestroy(): Unit = ???

  override val lifecycleId: String = ???
}
