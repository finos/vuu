package org.finos.vuu.example.virtualtable.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.example.virtualtable.bigdatacache.FakeBigDataCache
import org.finos.vuu.plugin.virtualized.table.{VirtualizedRange, VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.ViewPort

class ReallyBigVirtualizedDataProvider(implicit clock: Clock) extends VirtualizedProvider with StrictLogging {

  final val cache = new FakeBigDataCache
  final val logAt = new LogAtFrequency(10_000)

  override def runOnce(viewPort: ViewPort): Unit = {

    logger.trace("[ReallyBigVirtualizedDataProvider] Starting runOnce")

    //if this were a real virtualized provider
    //I would delegate these sorts and filters down into
    //the provider itself, in this example, I'm going to cheat and ignore them :-)
    val sort = viewPort.getSort
    val filter = viewPort.filterSpec

    val range = viewPort.getRange

    //typically we would want to get a bigger data set than the viewport is specifically looking at
    //as is probably more efficient, in this case we'll get just what they are asking for....
    val startIndex = Math.max((range.from - 5000), 0)
    val endIndex = range.to + 5000

    logger.trace(s"[ReallyBigVirtualizedDataProvider] Loading orders from Big Data Cache $startIndex to $endIndex")

    val (totalSize, bigOrders) = cache.loadOrdersInRange(startIndex, endIndex)

    viewPort.table.asTable match {
      case tbl: VirtualizedSessionTable =>
        logger.trace("[ReallyBigVirtualizedDataProvider] Set Range")
        val (millisRange, _) = timeIt{tbl.setRange(VirtualizedRange(startIndex, endIndex))}

        logger.trace("[ReallyBigVirtualizedDataProvider] Set Size")
        val (millisSize, _ ) = timeIt {tbl.setSize(totalSize)}
        logger.trace("[ReallyBigVirtualizedDataProvider] Adding rows ")
        val (millisRows, _) = timeIt {
          bigOrders.foreach({ case (index, order) => {
            val rowWithData = RowWithData(order.orderId.toString,
              Map("orderId" -> order.orderId.toString, "quantity" -> order.quantity, "price" -> order.price,
                "side" -> order.side, "trader" -> order.trader)
            )
            tbl.processUpdateForIndex(index, order.orderId.toString, rowWithData, clock.now())
          }
          })
        }

        logger.trace("[ReallyBigVirtualizedDataProvider] Getting Primary Keys")
        val (millisGetKeys, tableKeys) = timeIt { tbl.primaryKeys }

        logger.trace("[ReallyBigVirtualizedDataProvider] Setting Primary Keys")
        val (millisSetKeys, _ ) = timeIt { viewPort.setKeys(new VirtualizedViewPortKeys(tableKeys)) }

        if(logAt.shouldLog()){
          logger.info(s"[ReallyBigVirtualizedDataProvider] Complete runOnce millisRange = ${millisRange} millisSize=$millisSize millisRows=$millisRows millisGetKeys=$millisGetKeys millisSetKeys=$millisSetKeys")
        }
    }
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "org.finos.vuu.example.virtualtable.provider.ReallyBigVirtualizedDataProvider"

  override def getUniqueValues(columnName: String): Array[String] = ???

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] = ???
}
