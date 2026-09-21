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

  override def refreshSessionTable(viewPort: ViewPort, table: VirtualizedSessionTable): Unit = {

    logger.trace("[ReallyBigVirtualizedDataProvider] Starting runOnce")

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

    logger.trace("[ReallyBigVirtualizedDataProvider] Set Range")
    val (millisRange, _) = timeIt {
      table.setRange(startIndex, endIndex)
    }

    logger.trace("[ReallyBigVirtualizedDataProvider] Set Size")
    val (millisSize, _) = timeIt {
      table.setSize(totalSize)
    }
    logger.trace("[ReallyBigVirtualizedDataProvider] Adding rows ")
    val (millisRows, _) = timeIt {
      bigOrders.foreach({ case (index, order) => {
        val rowWithData = RowWithData(order.orderId.toString,
          Map("orderId" -> order.orderId.toString, "quantity" -> order.quantity, "price" -> order.price,
            "side" -> order.side, "trader" -> order.trader)
        )
        table.processUpdateForIndex(index, order.orderId.toString, rowWithData, clock.now())
      }
      })
    }

    logger.trace("[ReallyBigVirtualizedDataProvider] Getting Primary Keys")
    val (millisGetKeys, tableKeys) = timeIt {
      table.primaryKeys
    }

    logger.trace("[ReallyBigVirtualizedDataProvider] Setting Primary Keys")
    val (millisSetKeys, _) = timeIt {
      viewPort.setKeys(new VirtualizedViewPortKeys(tableKeys))
    }

    logger.debug(
      "[ReallyBigVirtualizedDataProvider] Complete runOnce on {}. millisRange={} millisSize={} millisRows={} millisGetKeys={} millisSetKeys={}",
      viewPort.id,
      millisRange,
      millisSize,
      millisRows,
      millisGetKeys,
      millisSetKeys
    )

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
