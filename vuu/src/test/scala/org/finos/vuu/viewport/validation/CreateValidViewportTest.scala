package org.finos.vuu.viewport.validation

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.CoreServerApiHandler
import org.finos.vuu.net.{ClientSessionId, CreateViewPortReject, CreateViewPortRequest, CreateViewPortSuccess, RequestContext, ViewServerMessage}
import org.finos.vuu.viewport.{AbstractViewPortTestCase, ViewPortRange, ViewPortTable}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers

class CreateValidViewportTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Check view port is valid") {

    Scenario("create viewport, with incorrect columns, check for error") {

      implicit val clock: Clock = new TestFriendlyClock(1311544800)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      Given("we've created a viewport with orders in")
      val (viewPortContainer, _, _, _, _, _, outQueue) = createDefaultOrderPricesViewPortInfra()

      val api = new CoreServerApiHandler(viewPortContainer, tableContainer = viewPortContainer.tableContainer, providers = viewPortContainer.providerContainer)

      val vpcolumnsOrders = List("orderId", "trader", "tradeTime", "quantity", "ric", "foo-bar")

      val ctx = RequestContext("req-101", ClientSessionId("A", "A"), outQueue, "token-0001")

      val exception = intercept[Exception] {
        api.process(CreateViewPortRequest(ViewPortTable("orders", "TEST"), ViewPortRange(0, 100), vpcolumnsOrders.toArray))(ctx)
      }
      exception.getMessage should startWith("Invalid columns specified in viewport request")
    }

    Scenario("create viewport for visible table, return success message") {
      implicit val clock: Clock = new TestFriendlyClock(1311544800)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      Given("we've created a viewport with orders in")
      val (viewPortContainer, _, _, _, outQueue) = createDefaultViewPortInfra()

      val api = new CoreServerApiHandler(viewPortContainer, tableContainer = viewPortContainer.tableContainer, providers = viewPortContainer.providerContainer)
      val ctx = RequestContext("req-101", ClientSessionId("A", "A"), outQueue, "token-0001")

      val result: Option[ViewServerMessage] = api.process(CreateViewPortRequest(ViewPortTable("orders", "TEST"), ViewPortRange(0, 100), Array("orderId")))(ctx)
      result.isDefined shouldBe true
      result.get.body.isInstanceOf[CreateViewPortSuccess] shouldBe true
      result.get.body.asInstanceOf[CreateViewPortSuccess].table shouldBe "orders"
    }

    Scenario("create viewport for invisible table, return reject message") {
      implicit val clock: Clock = new TestFriendlyClock(1311544800)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      Given("we've created a viewport with orders in")
      val (viewPortContainer, _, _, _, outQueue) = createDefaultViewPortInfraWithInvisibleTable()
      val api = new CoreServerApiHandler(viewPortContainer, tableContainer = viewPortContainer.tableContainer, providers = viewPortContainer.providerContainer)

      val ctx = RequestContext("req-101", ClientSessionId("A", "A"), outQueue, "token-0001")

      val result: Option[ViewServerMessage] = api.process(CreateViewPortRequest(ViewPortTable("orders", "TEST"), ViewPortRange(0, 100), Array("orderId")))(ctx)
      result.isDefined shouldBe true
      result.get.body.isInstanceOf[CreateViewPortReject] shouldBe true
      result.get.body.asInstanceOf[CreateViewPortReject].msg shouldBe "no table found for TEST:orders"
    }

    Scenario("create viewport for a table that doesn't exist, return reject message") {
      implicit val clock: Clock = new TestFriendlyClock(1311544800)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      Given("we've created a viewport with orders in")
      val (viewPortContainer, _, _, _, outQueue) = createDefaultViewPortInfraWithInvisibleTable()

      val api = new CoreServerApiHandler(viewPortContainer, tableContainer = viewPortContainer.tableContainer, providers = viewPortContainer.providerContainer)
      val ctx = RequestContext("req-101", ClientSessionId("A", "A"), outQueue, "token-0001")

      val result: Option[ViewServerMessage] = api.process(CreateViewPortRequest(ViewPortTable("random_table", "TEST"), ViewPortRange(0, 100), Array("orderId")))(ctx)
      result.isDefined shouldBe true
      result.get.body.isInstanceOf[CreateViewPortReject] shouldBe true
      result.get.body.asInstanceOf[CreateViewPortReject].msg shouldBe "no table found for TEST:random_table"
    }
  }
}
