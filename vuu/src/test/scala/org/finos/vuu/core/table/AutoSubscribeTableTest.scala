package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.joda.time.LocalDateTime
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class AutoSubscribeTableTest extends AnyFeatureSpec with Matchers {

  Feature("tables should support ability to subscribe when join requires it"){

    Scenario("create 2 tables, check 2nd has subscription requested when first is hydrated"){

      implicit val metrics = new MetricsProviderImpl

      val dateTime = new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

      //this scenario is supposed to mirror what would happen if we joined instruments to prices
      //by default we'd let the prices table ask its provider once for the data.
      val (orders, prices, orderPrices, ordersProvider, pricesProvider, joinProvider) = TableTestHelper.createOrderPricesScenario()

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))

      joinProvider.runOnce()

      pricesProvider.getSubRequestCount.get("VOD.L") should equal(1)

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      joinProvider.runOnce()

      pricesProvider.getSubRequestCount.get("VOD.L") should equal(1)

      //pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

      joinProvider.runOnce()

      pricesProvider.getSubRequestCount.get("BT.L") should equal(1)
    }
  }
}
