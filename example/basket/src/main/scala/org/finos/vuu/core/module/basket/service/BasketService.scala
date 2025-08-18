package org.finos.vuu.core.module.basket.service

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketConstants.Side
import org.finos.vuu.core.module.basket.BasketModule
import org.finos.vuu.core.module.basket.BasketModule.BasketConstituentTable
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.core.table._
import org.finos.vuu.net.RequestContext
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcFunctionFailure, RpcFunctionSuccess, RpcHandler, RpcParams}
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.viewport._

import java.util.concurrent.atomic.AtomicInteger

object BasketTradeId {

  private val counter: AtomicInteger = new AtomicInteger(0)

  def oneNew(user: String): String = {
    val counterValue = counter.incrementAndGet()
    user + "-" + "".padTo(5 - counterValue.toString.length, "0").mkString + counterValue
  }
}

trait BasketServiceIF {
  def createBasket(basketId: String, name: String)(ctx: RequestContext): ViewPortAction
}

// TODO: see comment on processViewPortRpcCall for why we extends DefaultRpcHandler with RpcHandler
class BasketService(val table: DataTable, val omsApi: OmsApi)(implicit clock: Clock, val tableContainer: TableContainer) extends DefaultRpcHandler with RpcHandler with BasketServiceIF with StrictLogging {

  import org.finos.vuu.core.module.basket.BasketModule.{BasketConstituentColumnNames => BC, BasketTradingColumnNames => BT, BasketTradingConstituentColumnNames => BTC}

  /**
   * We switched to DefaultRpcHandler instead of RpcHandler so that ViewportTypeAheadRpcHandler is enabled by default.
   * This class needs the processViewPortRpcCall from RpcHandler though.
   * Ideally we should switch to use DefaultRpcHandler.processViewPortRpcCall
   */
  override def processViewPortRpcCall(methodName: String, rpcParams: RpcParams): ViewPortAction = {
    super[RpcHandler].processViewPortRpcCall(methodName, rpcParams)
  }

  private def getConstituentsForSourceBasket(basketId: String): List[RowData] = {
    val table = tableContainer.getTable(BasketConstituentTable)
    val keys = table.primaryKeys.toList
    keys.map(key => table.pullRow(key)).filter(_.get(BC.BasketId).toString == basketId)
  }

  private def mkTradingConstituentRow(side: String, sourceBasketId: String, basketTradeInstanceId: String, constituentKey: String,
                                      quantity: Long, weighting: Double, limitPrice: Option[Double], basketConsRow: RowData): RowWithData = {
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
        BTC.LimitPrice -> limitPrice.orNull,
        BTC.Algo -> -1,
        BTC.OrderStatus -> OrderStates.PENDING,
        BTC.FilledQty -> 0
      ))
  }

  private def mkTradingBasketRow(sourceBasketId: String, basketTradeName: String, basketTradeInstanceId: String) = {
    RowWithData(basketTradeInstanceId, Map(BT.InstanceId -> basketTradeInstanceId, BT.Status -> "OFF-MARKET", BT.BasketId -> sourceBasketId, BT.BasketName -> basketTradeName, BT.Side -> Side.Buy, BT.Units -> 1))
  }

  def createBasket(sourceBasketId: String, basketTradeName: String)(ctx: RequestContext): ViewPortAction = {
    val basketTradeId = BasketTradeId.oneNew(ctx.session.user)
    val constituents = getConstituentsForSourceBasket(sourceBasketId)

    tableContainer.getTable(BasketModule.BasketTradingTable) match {
      case table: DataTable =>
        table.processUpdate(basketTradeId, mkTradingBasketRow(sourceBasketId, basketTradeName, basketTradeId))
      case null =>
        logger.error("Cannot find the Basket Trading table.")
    }

    val priceTable = tableContainer.getTable(PriceModule.PriceTable)
    tableContainer.getTable(BasketModule.BasketTradingConstituentTable) match {
      case table: DataTable =>
        constituents.foreach(rowData => {
          val ric = rowData.get(BTC.Ric).toString
          val constituentKey = s"$basketTradeId.$ric"
          val weighting = rowData.get(BTC.Weighting).asInstanceOf[Double]
          val quantity = (weighting * 100).asInstanceOf[Long]
          val side = rowData.get(BTC.Side).toString
          val limitPrice = getLastPrice(priceTable, ric)
          table.processUpdate(constituentKey, mkTradingConstituentRow(side, sourceBasketId, basketTradeId, constituentKey, quantity, weighting, limitPrice, rowData))
        })
      case null =>
        logger.error("Cannot find the Basket Trading Constituent.")
    }

    ViewPortCreateSuccess(basketTradeId)
  }

  private def getLastPrice(priceTable: DataTable, ric: String): Option[Double] = {
    priceTable.pullRow(ric) match {
      case row: RowWithData =>
        row.get("last") match {
          case null => None
          case price: Double => Some(price)
        }
      case EmptyRowData => None
    }
  }
}