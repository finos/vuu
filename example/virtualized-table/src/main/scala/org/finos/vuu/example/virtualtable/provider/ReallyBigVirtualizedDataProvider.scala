package org.finos.vuu.example.virtualtable.provider

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.example.virtualtable.bigdatacache.FakeBigDataCache
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.ViewPort

class ReallyBigVirtualizedDataProvider(val table: DataTable)(implicit clock: Clock) extends VirtualizedProvider {

  final val cache = new FakeBigDataCache
  final val internalTable = table.asInstanceOf[VirtualizedSessionTable]

  override def runOnce(viewPort: ViewPort): Unit = {

    //if this were a real virtualized provider
    //I would delegate these sorts and filters down into
    //the provider itself, in this example, I'm going to cheat and ignore them :-)
    val sort = viewPort.getSort
    val filter = viewPort.filterSpec

    val range = viewPort.getRange

    //typically we would want to get a bigger data set than the viewport is specifically looking at
    //as is probably more efficient, in this case we'll get just what they are asking for....
    val startIndex = range.from
    val endIndex = range.to

    val bigOrders = cache.loadOrdersInRange(startIndex, endIndex)

    internalTable.setRange(VirtualizedRange(startIndex, endIndex))
    internalTable.setSize(100_000_000)

    bigOrders.foreach({case(index, order) => {
      val rowWithData = RowWithData(order.orderId.toString,
        Map("orderId" -> order.orderId.toString, "quantity" -> order.quantity, "price" -> order.price,
          "side" -> order.side, "trader" -> order.trader)
      )
      internalTable.processUpdateForIndex(index, order.orderId.toString, rowWithData, clock.now())
    }})
  }

  override def subscribe(key: String): Unit = ???

  override def doStart(): Unit = ???

  override def doStop(): Unit = ???

  override def doInitialize(): Unit = ???

  override def doDestroy(): Unit = ???

  override val lifecycleId: String = ???
}
