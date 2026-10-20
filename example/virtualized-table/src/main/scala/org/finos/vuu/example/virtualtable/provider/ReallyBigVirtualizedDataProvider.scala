package org.finos.vuu.example.virtualtable.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.core.table.{RowWithData, SessionTable}
import org.finos.vuu.example.virtualtable.bigdatacache.FakeBigDataCache.DATASET_SIZE
import org.finos.vuu.example.virtualtable.bigdatacache.{BigDataOrder, FakeBigDataCache}
import org.finos.vuu.net.rpc.sessiontable.SessionTableCopyOption
import org.finos.vuu.net.rpc.sessiontable.SessionTableCopyOption.{All, Empty, Selected}
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
        val rowWithData = convertToRowData(order)
        table.processUpdateForIndex(index, order.orderId, rowWithData, clock.now())
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

  override def exportData(vp: ViewPort,
                          sessionTable: SessionTable,
                          columns: List[String],
                          copyOption: SessionTableCopyOption): Unit = {
    copyOption match {
      case All =>
        //In this example, it's just 0 to dataset size
        val keys = (0 to DATASET_SIZE).view.map(_.toString)
        copyData(keys, sessionTable, columns)
      case Selected =>
        copyData(vp.getSelection, sessionTable, columns)
      case Empty => //Nothing to do
    }
  }

  private def copyData(keys: Iterable[String], sessionTable: SessionTable, columns: List[String]): Unit = {
    val rowDataIterator = cache.loadOrdersForKeys(keys).take(sessionTable.getTableDef.options.maxSize)
    while (rowDataIterator.hasNext) {
      val rowData = convertToRowData(rowDataIterator.next())
      sessionTable.processUpdate(rowData)
    }
  }

  private def convertToRowData(bigDataOrder: BigDataOrder): RowWithData = {
    RowWithData(bigDataOrder.orderId,
      Map("orderId" -> bigDataOrder.orderId, "quantity" -> bigDataOrder.quantity, "price" -> bigDataOrder.price,
        "side" -> bigDataOrder.side, "trader" -> bigDataOrder.trader)
    )
  }

}
