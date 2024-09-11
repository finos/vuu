package org.finos.vuu.order.oms

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.ConcurrentHashMap
import javax.print.attribute.standard.Sides

case class TestOrderState(symbol: String, qty: Long, price: Double, state: String, filledQty: Long, filledPrice: Double)

class TestListener extends OmsListener with StrictLogging {

  private val ordersMap = new ConcurrentHashMap[String, TestOrderState]()

  def getOrderState(clientOrderId: String): Option[TestOrderState] = {
    Option(ordersMap.get(clientOrderId))
  }

  override def onAck(ack: Ack): Unit = {
    logger.trace("onAck:" + ack)
    ordersMap.put(ack.clientOrderId, TestOrderState(ack.symbol, ack.qty, ack.price, "ACKED", 0L, 0D))
  }

  override def onCancelAck(ack: CancelAck): Unit = {
    logger.trace("onCancelAck:" + ack)
    ordersMap.get(ack.clientOrderId) match {
      case state: TestOrderState => ordersMap.put(ack.clientOrderId, state.copy(state = "CANCELLED"))
    }
  }

  override def onReplaceAck(ack: ReplaceAck): Unit = {
    logger.trace("onReplaceAck:" + ack)
    ordersMap.get(ack.clientOrderId) match {
      case state: TestOrderState => ordersMap.put(ack.clientOrderId, state.copy(state = "ACKED"))
    }
  }

  override def onFill(fill: Fill): Unit = {
    logger.trace("onFill:" + fill)
    ordersMap.get(fill.clientOrderId) match {
      case state: TestOrderState => ordersMap.put(fill.clientOrderId, state.copy(filledQty = state.filledQty + fill.fillQty))
    }
  }
}

class OmsApiTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  import MaxTimes._

  Feature("Test the order management system api") {

    Scenario("Check we can submit one order and fill to completion") {

      implicit val clock: Clock = new TestFriendlyClock(1000L)

      val omsApi = OmsApi()

      val listener = new TestListener()

      omsApi.addListener(listener)

      omsApi.createOrder(NewOrder("BUY","VOD.L", 1000L, 100.01, "clOrdId1"))

      clock.sleep(MAX_ACK_TIME_MS)
      omsApi.runOnce()

      listener.getOrderState("clOrdId1").get.state should equal("ACKED")

      clock.sleep(MAX_FILL_TIME_MS)
      omsApi.runOnce()

      omsApi.containsOrder("clOrdId1") should equal(true)

      listener.getOrderState("clOrdId1").get.filledQty should be > 0L

      for (n <- 1 to 1000) {
        clock.sleep(MAX_FILL_TIME_MS)
        omsApi.runOnce()
      }

      omsApi.containsOrder("clOrdId1") should equal(false)
    }


    Scenario("Check we can submit order and cancel") {

      implicit val clock: Clock = new TestFriendlyClock(1000L)

      val omsApi = OmsApi()

      val listener = new TestListener()

      omsApi.addListener(listener)

      omsApi.createOrder(NewOrder("BUY", "VOD.L", 1000L, 100.01, "clOrdId1"))
      omsApi.createOrder(NewOrder("BUY", "BP.L", 1000L, 150.01, "clOrdId2"))

      clock.sleep(MAX_ACK_TIME_MS)
      omsApi.runOnce()

      listener.getOrderState("clOrdId1").get.state should equal("ACKED")

      val orderId = omsApi.getOrderId("clOrdId1").get
      omsApi.cancelOrder(CancelOrder(orderId))
      omsApi.runOnce()

      omsApi.containsOrder("clOrdId1") should equal(false)
      listener.getOrderState("clOrdId1").get.state should equal("CANCELLED")

      omsApi.containsOrder("clOrdId2") should equal(true)

    }
  }
}
