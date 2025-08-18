package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.service.OrderStates
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.order.oms._
import org.finos.vuu.provider.DefaultProvider

class BasketTradingConstituentProvider(val table: DataTable, val omsApi: OmsApi)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider  {

  private val runner = new LifeCycleRunner("TradingConsProviderRunner", runOnce, 50L)

  import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingConstituentColumnNames => BTC}

  omsApi.addListener(new OmsListener {
    override def onAck(ack: Ack): Unit = {
      table.processUpdate(ack.clientOrderId, RowWithData(ack.clientOrderId, Map[String, Any](BTC.InstanceIdRic -> ack.clientOrderId,
        BTC.OrderStatus -> OrderStates.ACKED)))
    }
    override def onCancelAck(ack: CancelAck): Unit = {
      table.processUpdate(ack.clientOrderId, RowWithData(ack.clientOrderId, Map[String, Any](BTC.InstanceIdRic -> ack.clientOrderId,
        BTC.OrderStatus -> OrderStates.CANCELLED)))
    }
    override def onReplaceAck(ack: ReplaceAck): Unit = ???
    override def onFill(fill: Fill): Unit = {
      val state = if(fill.orderQty == fill.totalFilledQty) OrderStates.FILLED else OrderStates.ACKED
      table.processUpdate(fill.clientOrderId, RowWithData(fill.clientOrderId, Map[String, Any](BTC.InstanceIdRic -> fill.clientOrderId,
        BTC.FilledQty -> fill.totalFilledQty, BTC.OrderStatus -> state)))
    }
  })

  def runOnce(): Unit = {
    omsApi.runOnce()
  }


  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketTradingConstituentProvider#" + hashCode()
}
