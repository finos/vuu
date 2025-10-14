package org.finos.vuu.core.table.join

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.*
import org.finos.vuu.core.table.{Columns, RowWithData, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider}
import org.scalatest.OneInstancePerTest
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.time.{LocalDateTime, ZoneId}


class MultiJoinTableTest extends AnyFeatureSpec with Matchers with OneInstancePerTest {

  Feature("Check we can create multi table joins"){

    Scenario("simple multi table join"){

      given timeProvider: Clock = new DefaultClock

      given lifecycle: LifecycleContainer = new LifecycleContainer

      given metrics: MetricsProvider = new MetricsProviderImpl

      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

      val ordersDef = TableDef("orders", "orderId", Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "ccyPairToUsd: String"), "ric", "orderId", "ccyPairToUsd")

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val instrumentDef = TableDef("instruments", "ric", Columns.fromNames("ric:String", "bbg:String", "isin:String"), "ric")

      val fxRatesDef = TableDef("fx", "ccyPair", Columns.fromNames("ccyPair:String", "bid:Double", "ask:String"), "ccyPair")

      val joinDef = JoinTableDef(
        name          = "orderPrices",
        visibility = Public,
        baseTable     = ordersDef,
        joinColumns   = Columns.allFrom(ordersDef) ++
                        Columns.allFromExcept(pricesDef, "ric") ++
                        Columns.allFromExcept(instrumentDef, "ric") ++
                        Columns.aliased(fxRatesDef, ("bid","fxBid"), ("ask","fxAsk"), ("ccyPair","ccyPair")),
                        //Columns.calculated("chris1", "bid * fxBid"),
        links = VisualLinks(),
        joinFields = Seq(),
        joins  =
            JoinTo(
              table = pricesDef,
              joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
            ),
            JoinTo(
                table = instrumentDef,
                joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
            ),
            JoinTo(
              table = fxRatesDef,
              joinSpec = JoinSpec( left = "ccyPairToUsd", right = "ccyPair", LeftOuterJoin)
            )
        )

      val joinProvider   = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val instruments = tableContainer.createTable(instrumentDef)
      val fxRates = tableContainer.createTable(fxRatesDef)

      val orderPrices = tableContainer.createJoinTable(joinDef)

      val ordersProvider = new MockProvider(orders)
      val pricesProvider = new MockProvider(prices)
      val instrumentsProvider = new MockProvider(instruments)
      val fxRatesProvider = new MockProvider(fxRates)
      val vpColumns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList)

      //val viewPortContainer = setupViewPort()

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L", "ccyPairToUsd" -> "GBPUSD"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
      instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bbg" -> "VOD", "isin" -> "1234566GGB"))
      fxRatesProvider.tick("GBPUSD", Map("ccyPair" -> "GBPUSD", "bid" -> 1.34, "ask" -> 1.341))

      joinProvider.runOnce()

      val row = orderPrices.pullRow("NYC-0001", vpColumns)

      val (key, data) = (row.asInstanceOf[RowWithData].key, row.asInstanceOf[RowWithData].data)

      print(data)

      key should equal("NYC-0001")

      data("fxAsk").asInstanceOf[Double] should be(1.341d +- 0.0000001)
      data("isin").asInstanceOf[String] should equal("1234566GGB")
      data.get("last") should be(Some(null))
      data("ask").asInstanceOf[Double] should equal(222.0d +- 0.0000001)
    }

    Scenario("simple multi table join, new join manager"){

      given timeProvider: Clock = new DefaultClock

      given lifecycle: LifecycleContainer = new LifecycleContainer

      given metrics: MetricsProvider = new MetricsProviderImpl

      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

      val ordersDef = TableDef("orders", "orderId", Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "ccyPairToUsd: String"), "ric", "orderId", "ccyPairToUsd")

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val instrumentDef = TableDef("instruments", "ric", Columns.fromNames("ric:String", "bbg:String", "isin:String"), "ric")

      val fxRatesDef = TableDef("fx", "ccyPair", Columns.fromNames("ccyPair:String", "bid:Double", "ask:String"), "ccyPair")

      val joinDef = JoinTableDef(
        name          = "orderPrices",
        visibility = Public,
        baseTable     = ordersDef,
        joinColumns   = Columns.allFrom(ordersDef) ++
          Columns.allFromExcept(pricesDef, "ric") ++
          Columns.allFromExcept(instrumentDef, "ric") ++
          Columns.aliased(fxRatesDef, ("bid","fxBid"), ("ask","fxAsk"), ("ccyPair","ccyPair")),
        //Columns.calculated("chris1", "bid * fxBid"),
        links = VisualLinks(),
        joinFields = Seq(),
        joins  =
          JoinTo(
            table = pricesDef,
            joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
          ),
        JoinTo(
          table = instrumentDef,
          joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
        ),
        JoinTo(
          table = fxRatesDef,
          joinSpec = JoinSpec( left = "ccyPairToUsd", right = "ccyPair", LeftOuterJoin)
        )
      )

      val joinProvider   = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val instruments = tableContainer.createTable(instrumentDef)
      val fxRates = tableContainer.createTable(fxRatesDef)

      val orderPrices = tableContainer.createJoinTable(joinDef)

      val ordersProvider = new MockProvider(orders)
      val pricesProvider = new MockProvider(prices)
      val instrumentsProvider = new MockProvider(instruments)
      val fxRatesProvider = new MockProvider(fxRates)

      val vpColumns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList)

      //val viewPortContainer = setupViewPort()

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L", "ccyPairToUsd" -> "GBPUSD"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
      instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bbg" -> "VOD", "isin" -> "1234566GGB"))
      fxRatesProvider.tick("GBPUSD", Map("ccyPair" -> "GBPUSD", "bid" -> 1.34, "ask" -> 1.341))

      joinProvider.runOnce()

      val row = orderPrices.pullRow("NYC-0001", vpColumns)

      val (key, data) = (row.asInstanceOf[RowWithData].key, row.asInstanceOf[RowWithData].data)

      print(data)

      key should equal("NYC-0001")

      data.get("fxAsk").get.asInstanceOf[Double] should be(1.341d +- 0.0000001)
      data.get("isin").get.asInstanceOf[String] should equal("1234566GGB")
      data.get("last") should be(Some(null))
      data.get("ask").get.asInstanceOf[Double] should equal(222.0d +- 0.0000001)
    }


  }



}
