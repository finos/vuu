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

  def createBasket(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {

    //logger.info("createBasket()")

    val basketKey = selection.rowKeyIndex.map({ case (key, _) => key }).toList.head

    val instanceKey = getAndPadCounter(session)

    val constituents = getConstituentsForBasketKey(basketKey)

    tableContainer.getTable(BasketModule.BasketTradingTable) match {
      case table: DataTable =>
        table.processUpdate(instanceKey, RowWithData(instanceKey, Map(BT.InstanceId -> instanceKey, BT.Status -> "OFF-MARKET", BT.BasketId -> basketKey)), clock.now())
      case null =>
    }

    tableContainer.getTable(BasketModule.BasketTradingConstituent) match {
      case table: DataTable =>
        constituents.foreach( rowData => {
          val constituentKey = instanceKey + "." + rowData.get(BTC.Ric)
          table.processUpdate(constituentKey, RowWithData(constituentKey, Map(BTC.BasketId -> basketKey, BTC.Ric -> rowData.get(BC.Ric) , BTC.InstanceId -> instanceKey,
            //BTC.Quantity -> rowData.get(BC.Quantity),
            BTC.InstanceIdRic -> constituentKey,
            BTC.Description -> rowData.get(BC.Description)
          )), clock.now())
        })
      case null =>
    }

    NoAction()
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu(
      new SelectionViewPortMenuItem("Create New", "", (sel, sess) => this.createBasket(sel, sess), "CREATE_NEW_BASKET"),
  )
}
