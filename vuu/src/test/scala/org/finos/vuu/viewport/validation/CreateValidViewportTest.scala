package org.finos.vuu.viewport.validation

import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.CoreServerApiHander
import org.finos.vuu.net.{ClientSessionId, CreateViewPortRequest, RequestContext, ServerApi}
import org.finos.vuu.viewport.{AbstractViewPortTestCase, ViewPortRange, ViewPortTable}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers

class CreateValidViewportTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Check view port is valid") {

    Scenario("create viewport, with incorrect columns, check for error") {

      Given("we've created a viewport with orders in")
      val (viewPortContainer, _, _, prices, _, _, outQueue, highPriorityQueue) = createDefaultOrderPricesViewPortInfra()

      val api = new CoreServerApiHander(viewPortContainer, tableContainer = viewPortContainer.tableContainer, providers = viewPortContainer.providerContainer)

      val vpcolumnsOrders = List("orderId", "trader", "tradeTime", "quantity", "ric", "foo-bar")

      val ctx = RequestContext("req-101", ClientSessionId("A", "A"), outQueue, highPriorityQueue, "token-0001")

      val exception = intercept[Exception]{
        api.process(CreateViewPortRequest(ViewPortTable("orders", "TEST"), ViewPortRange(0, 100), vpcolumnsOrders.toArray))(ctx)
      }
      exception.getMessage should startWith("Invalid columns specified in viewport request")
    }
  }
}
