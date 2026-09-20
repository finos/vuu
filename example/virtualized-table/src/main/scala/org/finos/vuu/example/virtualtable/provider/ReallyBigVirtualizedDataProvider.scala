package org.finos.vuu.example.virtualtable.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.example.virtualtable.bigdatacache.FakeBigDataCache
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.plugin.virtualized.provider.VirtualizedProvider
import org.finos.vuu.plugin.virtualized.table.{VirtualizedSessionTable, VirtualizedViewPortKeys}
import org.finos.vuu.viewport.ViewPort

class ReallyBigVirtualizedDataProvider(tableDef: VirtualizedSessionTableDef)(implicit clock: Clock) extends VirtualizedProvider with StrictLogging {

  private final val cache = new FakeBigDataCache
  private val refreshRate = tableDef.getRefreshRate.toMillis

  override def runOnceInternal(viewPort: ViewPort): Unit = {

    logger.trace("[ReallyBigVirtualizedDataProvider] Starting runOnce")

    val structuralHash = viewPort.getStructuralHashCode()

    //if this were a real virtualized provider
    //I would delegate these sorts and filters down into
    //the provider itself, in this example, I'm going to cheat and ignore them :-)
    val sort = viewPort.getSort
    val filter = viewPort.filterSpec

    val viewPortRange = viewPort.getRange
    val startIndex = viewPortRange.from
    val endIndex = viewPortRange.to

    logger.trace(s"[ReallyBigVirtualizedDataProvider] Loading orders from Big Data Cache $startIndex to $endIndex")

    val (totalSize, bigOrders) = cache.loadOrdersInRange(startIndex, endIndex)

    viewPort.table.asTable match {
      case tbl: VirtualizedSessionTable =>
        logger.trace("[ReallyBigVirtualizedDataProvider] Set Range")
        val (millisRange, _) = timeIt{tbl.setRange(startIndex, endIndex)}

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

        logger.trace("[ReallyBigVirtualizedDataProvider] Finish refresh")
        val (millisFinishRefresh, _) = timeIt {
          tbl.finishRefresh(structuralHash, viewPortRange, clock.now() + refreshRate)
        }

        logger.debug(
          "[ReallyBigVirtualizedDataProvider] Complete runOnce on {}. millisRange={} millisSize={} millisRows={} millisGetKeys={} millisSetKeys={} millisFinishRefresh={}",
          viewPort.id,
          millisRange,
          millisSize,
          millisRows,
          millisGetKeys,
          millisSetKeys,
          millisFinishRefresh
        )
    }
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "org.finos.vuu.example.virtualtable.provider.ReallyBigVirtualizedDataProvider"

  override def getUniqueValuesVPColumn(columnName: String, viewPort: ViewPort): Array[String] = Array.empty

  override def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPort: ViewPort): Array[String] = Array.empty
}
