package org.finos.vuu.order.oms

import org.finos.toolbox.time.Clock
import org.finos.vuu.order.oms.impl.InMemOmsApi

object MaxTimes{
  final val MAX_ACK_TIME_MS = 5_000
  final val MAX_FILL_TIME_MS = 8_000
}

case class NewOrder(side: String, symbol: String, qty: Long, price: Double, clientOrderId: String)
case class ReplaceOrder(orderId: Int, newPrice: Double, newQty: Long)
case class CancelOrder(orderId: Int)
case class Ack(orderId: Int, clientOrderId: String, symbol: String, qty: Long, price: Double)
case class CancelAck(orderId: Int, clientOrderId: String)
case class ReplaceAck(orderId: Int, clientOrderId: String)
case class Fill(orderid: Int, fillQty: Long, fillPrice: Double, clientOrderId: String, totalFilledQty: Long)

trait OmsApi {
  def createOrder(newOrder: NewOrder): Unit
  def replaceOrder(replaceOrder: ReplaceOrder): Unit
  def cancelOrder(cancelOrder: CancelOrder): Unit
  def addListener(omsListener: OmsListener): Unit
  def runOnce(): Unit
  def containsOrder(clientOrderId: String): Boolean
}

trait OmsListener{
  def onAck(ack: Ack): Unit
  def onCancelAck(ack: CancelAck): Unit
  def onReplaceAck(ack: ReplaceAck): Unit
  def onFill(fill: Fill): Unit
}

object OmsApi{
  def apply()(implicit clock: Clock): OmsApi = {
      new InMemOmsApi()
  }
}
