package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.basket.BasketModule.BasketConstituentTable
import org.finos.vuu.core.table.{DataTable, RowData, RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.viewport.{NoAction, SelectionViewPortMenuItem, ViewPortAction, ViewPortMenu, ViewPortSelection}

import java.util.concurrent.atomic.AtomicInteger

class BasketService(val table: DataTable, val tableContainer: TableContainer)(implicit clock: Clock) extends RpcHandler with StrictLogging {

  private val counter = new AtomicInteger(0)

  import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingColumnNames => BT}
  import org.finos.vuu.core.module.basket.BasketModule.{BasketConstituentColumnNames => BC}
  import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingConstituentColumnNames => BTC}

  private def getAndPadCounter(session: ClientSessionId): String = {
    val counterValue = counter.incrementAndGet()
    session.user + "-" + "".padTo(5 - counterValue.toString.length, "0").mkString + counterValue
  }

  private def getConstituentsForBasketKey(key: String): List[RowData] = {
    val table = tableContainer.getTable(BasketConstituentTable)
    val keys = table.primaryKeys.toList
    keys.map( key => table.pullRow(key) ).filter(_.get(BC.BasketId).toString == key)
  }

  private def mkTradingConstituentRow(side: String, basketKey: String, instanceKey: String, constituentKey: String, quantity: Long, basketConsRow: RowData): RowWithData = {
    RowWithData(constituentKey, Map(BTC.BasketId -> basketKey, BTC.Ric -> basketConsRow.get(BC.Ric), BTC.InstanceId -> instanceKey,
      BTC.Quantity -> quantity,
      BTC.InstanceIdRic -> constituentKey,
      BTC.Description -> basketConsRow.get(BC.Description),
      BTC.Side -> side
    ))
  }

  private def mkTradingBasketRow(instanceKey: String, basketKey: String): RowWithData = {
    RowWithData(instanceKey, Map(BT.InstanceId -> instanceKey, BT.Status -> "OFF-MARKET", BT.BasketId -> basketKey))
  }

  def createBasket(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {

    val basketKey = selection.rowKeyIndex.map({ case (key, _) => key }).toList.head

    val instanceKey = getAndPadCounter(session)

    val constituents = getConstituentsForBasketKey(basketKey)

    tableContainer.getTable(BasketModule.BasketTradingTable) match {
      case table: DataTable =>
        table.processUpdate(instanceKey, mkTradingBasketRow(instanceKey, basketKey), clock.now())
      case null =>
        logger.error("Cannot find the Basket Trading table.")
    }

    tableContainer.getTable(BasketModule.BasketTradingConstituent) match {
      case table: DataTable =>
        constituents.foreach( rowData => {
          val constituentKey = instanceKey + "." + rowData.get(BTC.Ric)
          val weighting = rowData.get(BTC.Weighting).asInstanceOf[Double]
          val quantity = (weighting * 100).asInstanceOf[Long]
          val side = rowData.get(BTC.Side).toString
          table.processUpdate(constituentKey, mkTradingConstituentRow(side, basketKey, instanceKey, constituentKey, quantity, rowData), clock.now())
        })
      case null =>
        logger.error("Cannot find the Basket Trading Constituent.")
    }

    NoAction()
    }

  override def menuItems(): ViewPortMenu = ViewPortMenu(
      new SelectionViewPortMenuItem("Create New", "", (sel, sess) => this.createBasket(sel, sess), "CREATE_NEW_BASKET"),
  )
}
