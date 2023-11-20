package org.finos.vuu.order.oms.impl

import org.finos.toolbox.time.Clock
import org.finos.vuu.order.oms.impl.States.PENDING_ACK
import org.finos.vuu.order.oms.{Ack, CancelOrder, Fill, NewOrder, OmsApi, OmsListener, ReplaceOrder}

import java.util.concurrent.atomic.AtomicInteger
import scala.util.Random

object States {
  def ACKED = 'A'

  def PENDING_ACK = '~'

  def CANCELLED = 'X'

  def PENDING_REPLACE = 'R'

  def FILLED = 'F'
}

case class InMemOrderState(symbol: String, qty: Long, price: Double, clientOrderId: String, state: Char, nextEventTime: Long, orderId: Int, filledQty: Long)

object OrderId {
  private val orderId = new AtomicInteger(0)
  def nextOrderId(): Int = orderId.incrementAndGet()
}

class InMemOmsApi(implicit val clock: Clock) extends OmsApi {

  private final val random = new Random(clock.now())

  @volatile private var orders = List[InMemOrderState]()
  @volatile private var listeners = List[OmsListener]()


  override def containsOrder(clientOrderId: String): Boolean = orders.exists(_.clientOrderId == clientOrderId)

  override def createOrder(newOrder: NewOrder): Unit = {
    orders = orders ++ List(InMemOrderState(newOrder.symbol, newOrder.qty, newOrder.price,
      newOrder.clientOrderId, States.PENDING_ACK, clock.now() + random.between(1, 1000), OrderId.nextOrderId(), 0L))
  }

  override def replaceOrder(replaceOrder: ReplaceOrder): Unit = ???

  override def cancelOrder(cancelOrder: CancelOrder): Unit = ???

  override def addListener(omsListener: OmsListener): Unit = listeners = listeners ++ List(omsListener)

  override def runOnce(): Unit = {
    orders = orders.map(orderstate => {

      if (orderstate.nextEventTime <= clock.now()) {

        orderstate.state match {
          case '~' =>
            val orderId = OrderId.nextOrderId()
            listeners.foreach(_.onAck(Ack(orderId, orderstate.clientOrderId, orderstate.symbol, orderstate.qty, orderstate.price)))
            orderstate.copy(state = States.ACKED, nextEventTime = clock.now() + random.between(1000, 5000), orderId = orderId)
          case 'A' =>
            val remainingQty = orderstate.qty - orderstate.filledQty
            val fillQty = if(remainingQty > 1) random.between(1, orderstate.qty - orderstate.filledQty) else 1
            listeners.foreach(_.onFill(Fill(orderstate.orderId, fillQty, orderstate.price, orderstate.clientOrderId, orderstate.filledQty + fillQty)))
            orderstate.copy(filledQty = orderstate.filledQty + fillQty, nextEventTime = clock.now() + random.between(1000, 5000))
          case _ =>
            orderstate
        }

      } else {
        orderstate
      }
    })

   orders = orders.filter(os => os.filledQty != os.qty)

  }

}
