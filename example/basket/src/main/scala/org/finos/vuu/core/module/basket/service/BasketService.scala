package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.basket.BasketModule.{BasketConstituentTable, Sides}
import org.finos.vuu.core.table.{DataTable, RowData, RowWithData, TableContainer}
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.viewport._
import java.util.concurrent.atomic.AtomicInteger

object BasketTradeId {

  private val counter: AtomicInteger = new AtomicInteger(0)
  var current:String = "NoneInitalised" //this is for testing but only works if tests that use this doesnt run in parallel
  def oneNew(user:String): String = {
    val counterValue = counter.incrementAndGet()
    current = user + "-" + "".padTo(5 - counterValue.toString.length, "0").mkString + counterValue
    current
  }
}

trait BasketServiceIF{
  def createBasket(basketId: String, name: String)(ctx: RequestContext): ViewPortAction
}

class BasketService(val table: DataTable, val tableContainer: TableContainer, val omsApi: OmsApi)(implicit clock: Clock) extends RpcHandler with BasketServiceIF with StrictLogging {

  import org.finos.vuu.core.module.basket.BasketModule.{BasketConstituentColumnNames => BC, BasketTradingColumnNames => BT, BasketTradingConstituentColumnNames => BTC}

  private def getConstituentsForSourceBasket(basketId: String): List[RowData] = {
    val table = tableContainer.getTable(BasketConstituentTable)
    val keys = table.primaryKeys.toList
    keys.map( key => table.pullRow(key) ).filter(_.get(BC.BasketId).toString == basketId)
  }

  private def mkTradingConstituentRow(side: String, sourceBasketId: String, basketTradeInstanceId: String, constituentKey: String,
                                      quantity: Long, weighting: Double, basketConsRow: RowData): RowWithData = {
    RowWithData(
      constituentKey,
      Map(
        BTC.Ric -> basketConsRow.get(BC.Ric),
        BTC.BasketId -> sourceBasketId,
        BTC.InstanceId -> basketTradeInstanceId,
        BTC.InstanceIdRic -> constituentKey,
        BTC.Quantity -> quantity,
        BTC.Description -> basketConsRow.get(BC.Description),
        BTC.Side -> side,
        BTC.Weighting -> weighting,
        BTC.PriceStrategyId -> 2,
        BTC.Algo -> -1,
        BTC.OrderStatus -> OrderStates.PENDING,
        BTC.FilledQty -> 0
      ))
  }

  private def mkTradingBasketRow(sourceBasketId: String, basketTradeName: String, basketTradeInstanceId: String) = {
    RowWithData(basketTradeInstanceId, Map(BT.InstanceId -> basketTradeInstanceId, BT.Status -> "OFF-MARKET", BT.BasketId -> sourceBasketId, BT.BasketName -> basketTradeName, BT.Side -> Sides.Buy, BT.Units -> 1))
  }

  def createBasketFromRpc(basketId: String, name: String)(ctx: RequestContext): ViewPortAction = {
    createBasket(basketId, name)(ctx)
  }

  def createBasket(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {

    val basketId = selection.rowKeyIndex.map({ case (key, _) => key }).toList.head

    val instanceKey = BasketTradeId.oneNew(session.user)

    createBasketInternal(basketId, instanceKey, instanceKey, session)
  }

  def createBasket(basketId: String, name: String)(ctx: RequestContext): ViewPortAction = {
    val basketTradeId = BasketTradeId.oneNew(ctx.session.user)
    createBasketInternal(basketId, name, basketTradeId, ctx.session)
  }

  private def createBasketInternal(sourceBasketId: String, basketTradeName: String, basketTradeId: String, sessionId: ClientSessionId) = {

    val constituents = getConstituentsForSourceBasket(sourceBasketId)

    tableContainer.getTable(BasketModule.BasketTradingTable) match {
      case table: DataTable =>
        table.processUpdate(basketTradeId, mkTradingBasketRow(sourceBasketId, basketTradeName, basketTradeId), clock.now())
      case null =>
        logger.error("Cannot find the Basket Trading table.")
    }

    tableContainer.getTable(BasketModule.BasketTradingConstituentTable) match {
      case table: DataTable =>
        constituents.foreach( rowData => {
          val constituentKey = basketTradeId + "." + rowData.get(BTC.Ric)
          val weighting = rowData.get(BTC.Weighting).asInstanceOf[Double]
          val quantity = (weighting * 100).asInstanceOf[Long]
          val side = rowData.get(BTC.Side).toString
          table.processUpdate(constituentKey, mkTradingConstituentRow(side, sourceBasketId, basketTradeId, constituentKey, quantity, weighting, rowData), clock.now())
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
