package org.finos.vuu.viewport.validation

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.CoreServerApiHandler
import org.finos.vuu.net.{ClientSessionId, CreateViewPortRequest, RequestContext}
import org.finos.vuu.viewport.{AbstractViewPortTestCase, ViewPortRange, ViewPortTable}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers

class CreateValidViewportTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Check view port is valid") {

    Scenario("create viewport, with incorrect columns, check for error") {

      implicit val clock: Clock = new TestFriendlyClock(1311544800)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      Given("we've created a viewport with orders in")
      val (viewPortContainer, _, _, prices, _, _, outQueue) = createDefaultOrderPricesViewPortInfra()

      val api = new CoreServerApiHandler(viewPortContainer, tableContainer = viewPortContainer.tableContainer, providers = viewPortContainer.providerContainer)

      val vpcolumnsOrders = List("orderId", "trader", "tradeTime", "quantity", "ric", "foo-bar")

      val ctx = RequestContext("req-101", ClientSessionId("A", "A"), outQueue, "token-0001")

      val exception = intercept[Exception]{
        api.process(CreateViewPortRequest(ViewPortTable("orders", "TEST"), ViewPortRange(0, 100), vpcolumnsOrders.toArray))(ctx)
      }
      exception.getMessage should startWith("Invalid columns specified in viewport request")
    }
  }
}
