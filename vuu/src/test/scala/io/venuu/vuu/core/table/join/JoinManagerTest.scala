package io.venuu.vuu.core.table.join

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.api._
import io.venuu.vuu.core.table.join.JoinAsserts._
import io.venuu.vuu.core.table.{Columns, KeyObserver, RowKeyUpdate, TableContainer}
import io.venuu.vuu.provider.{JoinTableProvider, VuuJoinTableProvider}
import io.venuu.vuu.viewport.ViewPortSetup
import org.joda.time.LocalDateTime
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.util

class JoinManagerTest extends AnyFeatureSpec with Matchers with StrictLogging with ViewPortSetup {

  implicit val timeProvider: Clock = new DefaultClock
  implicit val metrics = new MetricsProviderImpl

  final val dateTime = new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

  case class NamedKeyObserver(name: String) extends KeyObserver[RowKeyUpdate] {
    override def onUpdate(update: RowKeyUpdate): Unit = {}

    override def hashCode(): Int = name.hashCode

    override def equals(obj: scala.Any): Boolean = {
      obj.isInstanceOf[NamedKeyObserver] && obj.asInstanceOf[NamedKeyObserver].name == this.name
    }
  }

  def makeOrderEvent(orderId: String, ric: String, isDeleted: Boolean = false) = {
    val event = new java.util.HashMap[String, Any]();
    event.put("orderId", orderId)
    event.put("ric", ric)
    //event.put("instrument.description", "Vodaphone");
    event.put("_isDeleted", isDeleted);
    event
  }

  def makeOrders2Event(orderId: String, ric: String, currencyPair: String, isDeleted: Boolean = false) = {
    val event = new java.util.HashMap[String, Any]();
    event.put("orderId", orderId)
    event.put("ric", ric)
    event.put("currencyPair", currencyPair)
    //event.put("instrument.description", "Vodaphone");
    event.put("_isDeleted", isDeleted);
    event
  }

  def makeCurrencyParisEvent(ccyPair: String, rate: Double, isDeleted: Boolean = false) = {
    val event = new java.util.HashMap[String, Any]();
    event.put("currencyPair", ccyPair)
    event.put("_isDeleted", isDeleted);
    event
  }

  def makePricesEvent(ric: String, isDeleted: Boolean = false) = {
    val event = new java.util.HashMap[String, Any]();
    event.put("ric", ric)
    event.put("_isDeleted", isDeleted);
    event
  }

  def makeChildOrdersEvent(orderId: String, childOrderId: String, isDeleted: Boolean = false) = {
    val event = new java.util.HashMap[String, Any]();
    event.put("orderId", orderId)
    event.put("childOrderId", childOrderId)
    event.put("_isDeleted", isDeleted);
    event
  }

  def mkeOrdersDef() = {
    TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "ric", "orderId")
  }

  def mkeChildOrdersDef() = {
    TableDef(
      name = "childOrders",
      keyField = "childOrderId",
      columns = Columns.fromNames("childOrderId:String", "orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "childOrderId", "orderId")
  }

  def mkeOrders2Def() = {
    TableDef(
      name = "orders2",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String",
                                          "tradeTime:Long", "quantity:Double", "currencyPair: String"
                ),
      joinFields = "ric", "orderId", "currencyPair")
  }

  def mkeCcyPairDef() = {
    TableDef(
      name = "fxRates",
      keyField = "currencyPair",
      columns = Columns.fromNames("currencyPair:String", "fxRate:Double"),
      joinFields = "currencyPair")
  }


  def mkePricesDef() = {
    TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")
  }

  def mkeOrderPricesDef(ordersDef: TableDef, pricesDef: TableDef) = {
    JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      joinFields = Seq("orderId")
    )
  }

  def mkeChildOrdersToOrderPricesDef(childOrders: TableDef, orderPrices: TableDef) = {
    JoinTableDef(
      name = "childOrderPrices",
      baseTable = childOrders,
      joinColumns = Columns.allFrom(orderPrices) ++ Columns.allFromExcept(childOrders, "orderId"),
      joins =
        JoinTo(
          table = orderPrices,
          joinSpec = JoinSpec(left = "orderId", right = "orderId", LeftOuterJoin)
        ),
      joinFields = Seq()
    )
  }

  def mkeOrder2PricesRatesDef(orders2Def: TableDef, pricesDef: TableDef, fxRates: TableDef) = {
    JoinTableDef(
      name = "order2PricesAndFx",
      baseTable = orders2Def,
      joinColumns = Columns.allFrom(orders2Def)
        ++ Columns.allFromExcept(pricesDef, "ric")
        ++ Columns.allFromExcept(fxRates, "currencyPair"),
      joinFields = Seq(),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      JoinTo(
        table = fxRates,
        joinSpec = JoinSpec(left = "currencyPair", right = "currencyPair", LeftOuterJoin)
      )
    )
  }

  def sendEvent(table: String, event: util.HashMap[String, Any])(implicit joinTableProvider: JoinTableProvider) = {
    joinTableProvider.sendEvent(table, event)
  }

  Feature("Check Join Manager Functionality in table joins") {

    Scenario("Left Outer Join") {

      implicit val lifecycle = new LifecycleContainer

      implicit val joinTableProvider = new VuuJoinTableProvider()

      val ordersDef = mkeOrdersDef()

      val pricesDef = mkePricesDef()

      val joinDef = mkeOrderPricesDef(ordersDef, pricesDef)

      val tableContainer = new TableContainer(joinTableProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      joinTableProvider.start()

      sendEvent("orders", makeOrderEvent("1", "VOD.L"))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("1", "VOD.L", false, null, null)
        )
      )

      sendEvent("orders", makeOrderEvent("2", "VOD.L"))
      sendEvent("orders", makeOrderEvent("3", "VOD.L"))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("2", "VOD.L", false, null, null),
          ("3", "VOD.L", false, null, null)
        )
      )

      sendEvent("prices", makePricesEvent("VOD.L"))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("1", "VOD.L", false, "VOD.L", false),
          ("2", "VOD.L", false, "VOD.L", false),
          ("3", "VOD.L", false, "VOD.L", false)
        )
      )

    }

    Scenario("Left Outer Join, Right key update") {
      implicit val lifecycle = new LifecycleContainer

      implicit val joinTableProvider = new VuuJoinTableProvider()

      val ordersDef = mkeOrdersDef()

      val pricesDef = mkePricesDef()

      val joinDef = mkeOrderPricesDef(ordersDef, pricesDef)

      val tableContainer = new TableContainer(joinTableProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      joinTableProvider.start()

      sendEvent("orders", makeOrderEvent("1", "VOD.L"))
      sendEvent("orders", makeOrderEvent("2", "VOD.L"))
      sendEvent("orders", makeOrderEvent("3", "VOD.L"))
      sendEvent("prices", makePricesEvent("VOD.L"))
      sendEvent("prices", makePricesEvent("BT.L"))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("1", "VOD.L", false, null, null),
          ("2", "VOD.L", false, null, null),
          ("3", "VOD.L", false, null, null),
          ("1", "VOD.L", false, "VOD.L", false),
          ("2", "VOD.L", false, "VOD.L", false),
          ("3", "VOD.L", false, "VOD.L", false)
        )
      )

      //do a foreignKey update (cheeky) and check the update comes through for order id = 1
      sendEvent("orders", makeOrderEvent("1", "BT.L"))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("1", "BT.L", false, "BT.L", false),
        )
      )
    }

    Scenario("Left Outer Join, Orders to Prices Instruments and Fx Rates") {

      implicit val lifecycle = new LifecycleContainer

      implicit val joinTableProvider = new VuuJoinTableProvider()

      val ordersDef = mkeOrders2Def()
      val pricesDef = mkePricesDef()
      val fxRatesDef = mkeCcyPairDef()

      val joinDef = mkeOrder2PricesRatesDef(ordersDef, pricesDef, fxRatesDef)

      val tableContainer = new TableContainer(joinTableProvider)

      val orders2 = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val ccyPairs = tableContainer.createTable(fxRatesDef)

      val order2PricesRates = tableContainer.createJoinTable(joinDef)

      joinTableProvider.start()

      sendEvent("orders2", makeOrders2Event("1", "VOD.L", "USDGBP"))
      sendEvent("orders2", makeOrders2Event("2", "VOD.L", "USDGBP"))
      sendEvent("orders2", makeOrders2Event("3", "VOD.L", "USDGBP"))

      sendEvent("prices", makePricesEvent("VOD.L"))

      assertJoins("order2PricesAndFx", joinTableProvider)(
        Table(
          ("orders2.orderId", "orders2.ric", "orders2.currencyPair", "orders2._isDeleted", "prices.ric", "prices._isDeleted", "fxRates.currencyPair", "fxRates._isDeleted"),
          ("1", "VOD.L", "USDGBP", false, null, null, null, null),
          ("2", "VOD.L", "USDGBP", false, null, null, null, null),
          ("3", "VOD.L", "USDGBP", false, null, null, null, null),
          ("1", "VOD.L", "USDGBP", false, "VOD.L", false, null, null),
          ("2", "VOD.L", "USDGBP", false, "VOD.L", false, null, null),
          ("3", "VOD.L", "USDGBP", false, "VOD.L", false, null, null)
        )
      )

      sendEvent("fxRates", makeCurrencyParisEvent("USDGBP", 1.2345))

      assertJoins("order2PricesAndFx", joinTableProvider)(
        Table(
          ("orders2.orderId","orders2.ric","orders2.currencyPair","orders2._isDeleted","prices.ric","prices._isDeleted","fxRates.currencyPair","fxRates._isDeleted"),
          ("1"       ,"VOD.L"   ,"USDGBP"  ,false     ,"VOD.L"   ,false     ,"USDGBP"  ,false     ),
          ("2"       ,"VOD.L"   ,"USDGBP"  ,false     ,"VOD.L"   ,false     ,"USDGBP"  ,false     ),
          ("3"       ,"VOD.L"   ,"USDGBP"  ,false     ,"VOD.L"   ,false     ,"USDGBP"  ,false     )
        )
      )

    }

    Scenario("Left Outer Join, Delete Left Record") {

      implicit val lifecycle = new LifecycleContainer

      implicit val joinTableProvider = new VuuJoinTableProvider()

      val ordersDef = mkeOrdersDef()

      val pricesDef = mkePricesDef()

      val joinDef = mkeOrderPricesDef(ordersDef, pricesDef)

      val tableContainer = new TableContainer(joinTableProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      joinTableProvider.start()

      sendEvent("orders", makeOrderEvent("1", "VOD.L"))
      sendEvent("orders", makeOrderEvent("2", "VOD.L"))
      sendEvent("orders", makeOrderEvent("3", "VOD.L"))
      sendEvent("prices", makePricesEvent("VOD.L"))
      sendEvent("prices", makePricesEvent("BT.L"))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("1", "VOD.L", false, null, null),
          ("2", "VOD.L", false, null, null),
          ("3", "VOD.L", false, null, null),
          ("1", "VOD.L", false, "VOD.L", false),
          ("2", "VOD.L", false, "VOD.L", false),
          ("3", "VOD.L", false, "VOD.L", false)
        )
      )

      sendEvent("orders", makeOrderEvent("3", "VOD.L", true))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("3", "VOD.L", true, "VOD.L", false)
        )
      )

      sendEvent("orders", makeOrderEvent("2", "VOD.L", true))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("2", "VOD.L", true, "VOD.L", false)
        )
      )
    }

    Scenario("Left Outer Join, Delete Right Record") {
      implicit val lifecycle = new LifecycleContainer

      implicit val joinTableProvider = new VuuJoinTableProvider()

      val ordersDef = mkeOrdersDef()

      val pricesDef = mkePricesDef()

      val joinDef = mkeOrderPricesDef(ordersDef, pricesDef)

      val tableContainer = new TableContainer(joinTableProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      joinTableProvider.start()

      sendEvent("orders", makeOrderEvent("1", "VOD.L"))
      sendEvent("orders", makeOrderEvent("2", "VOD.L"))
      sendEvent("orders", makeOrderEvent("3", "VOD.L"))
      sendEvent("prices", makePricesEvent("VOD.L"))
      sendEvent("prices", makePricesEvent("BT.L"))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("1", "VOD.L", false, null, null),
          ("2", "VOD.L", false, null, null),
          ("3", "VOD.L", false, null, null),
          ("1", "VOD.L", false, "VOD.L", false),
          ("2", "VOD.L", false, "VOD.L", false),
          ("3", "VOD.L", false, "VOD.L", false)
        )
      )

      sendEvent("prices", makePricesEvent("VOD.L", true))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("1", "VOD.L", false, "VOD.L", true),
          ("2", "VOD.L", false, "VOD.L", true),
          ("3", "VOD.L", false, "VOD.L", true)
        )
      )

    }

    Scenario("Left Outer Join of Joins") {
      implicit val lifecycle = new LifecycleContainer

      implicit val joinTableProvider = new VuuJoinTableProvider()

      val ordersDef = mkeOrdersDef()
      val pricesDef = mkePricesDef()
      val childOrdersDef = mkeChildOrdersDef()

      val joinDef = mkeOrderPricesDef(ordersDef, pricesDef)

      val childOrderPricesDef = mkeChildOrdersToOrderPricesDef(childOrdersDef, joinDef)

      val tableContainer = new TableContainer(joinTableProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val childOrders = tableContainer.createTable(childOrdersDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)
      val childOrderPrices = tableContainer.createJoinTable(childOrderPricesDef)

      joinTableProvider.start()

      sendEvent("orders", makeOrderEvent("1", "VOD.L"))
      sendEvent("orders", makeOrderEvent("2", "VOD.L"))
      sendEvent("orders", makeOrderEvent("3", "VOD.L"))
      sendEvent("prices", makePricesEvent("VOD.L"))
      sendEvent("prices", makePricesEvent("BT.L"))

      //we have to propagate the join data to the tables here or the subsequent event won't work, rather than empty and assert
      joinTableProvider.runOnce()

      sendEvent("childOrders", makeChildOrdersEvent("1", "100"))

      assertJoins("childOrderPrices", joinTableProvider)(
        Table(
          ("childOrders.orderId","orderPrices.orderId","orderPrices._isDeleted","childOrders._isDeleted","childOrders.childOrderId"),
          ("1"       ,"1"       ,null      ,false     ,"100"     )
        )
      )
    }
  }
}
