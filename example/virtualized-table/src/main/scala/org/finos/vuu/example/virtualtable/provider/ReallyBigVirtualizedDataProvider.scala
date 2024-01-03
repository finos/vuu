package org.finos.vuu.example.virtualtable.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.example.virtualtable.bigdatacache.FakeBigDataCache
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.ViewPort

class ReallyBigVirtualizedDataProvider(implicit clock: Clock) extends VirtualizedProvider with StrictLogging {

  final val cache = new FakeBigDataCache

  override def runOnce(viewPort: ViewPort): Unit = {

    logger.info("[ReallyBigVirtualizedDataProvider] Starting runOnce")

    //if this were a real virtualized provider
    //I would delegate these sorts and filters down into
    //the provider itself, in this example, I'm going to cheat and ignore them :-)
    val sort = viewPort.getSort
    val filter = viewPort.filterSpec

    val range = viewPort.getRange

    //typically we would want to get a bigger data set than the viewport is specifically looking at
    //as is probably more efficient, in this case we'll get just what they are asking for....
    val startIndex = Math.min((range.from - 5000), 0)
    val endIndex = range.to + 5000

    logger.info("[ReallyBigVirtualizedDataProvider] Loading orders from Big Data Cache")

    val (totalSize, bigOrders) = cache.loadOrdersInRange(startIndex, endIndex)

    viewPort.table.asTable match {
      case tbl: VirtualizedSessionTable =>
        logger.info("[ReallyBigVirtualizedDataProvider] Set Range")
        tbl.setRange(VirtualizedRange(startIndex, endIndex))
        logger.info("[ReallyBigVirtualizedDataProvider] Set Size")
        tbl.setSize(totalSize)
        logger.info("[ReallyBigVirtualizedDataProvider] Adding rows ")
        bigOrders.foreach({case(index, order) => {
          val rowWithData = RowWithData(order.orderId.toString,
            Map("orderId" -> order.orderId.toString, "quantity" -> order.quantity, "price" -> order.price,
              "side" -> order.side, "trader" -> order.trader)
          )
          tbl.processUpdateForIndex(index, order.orderId.toString, rowWithData, clock.now())
        }})

        logger.info("[ReallyBigVirtualizedDataProvider] Getting Primary Keys")
        val tableKeys = tbl.primaryKeys

        logger.info("[ReallyBigVirtualizedDataProvider] Setting Primary Keys")
        viewPort.setKeys(new VirtualizedViewPortKeys(tableKeys))
    }
    logger.info("[ReallyBigVirtualizedDataProvider] Complete runOnce")
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "org.finos.vuu.example.virtualtable.provider.ReallyBigVirtualizedDataProvider"
}
