package org.finos.vuu.core.table.join

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api._
import org.finos.vuu.core.table.join.JoinAsserts._
import org.finos.vuu.core.table.{Columns, KeyObserver, RowKeyUpdate, TableContainer}
import org.finos.vuu.provider.{JoinTableProvider, VuuJoinTableProvider}
import org.finos.vuu.viewport.ViewPortSetup
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.time.{LocalDateTime, ZoneId}
import java.util

class JoinManagerTest extends AnyFeatureSpec with Matchers with StrictLogging with ViewPortSetup {

  implicit val timeProvider: Clock = new DefaultClock
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

  case class NamedKeyObserver(name: String) extends KeyObserver[RowKeyUpdate] {
    override def onUpdate(update: RowKeyUpdate): Unit = {}

    override def hashCode(): Int = name.hashCode

    override def equals(obj: scala.Any): Boolean = {
      obj.isInstanceOf[NamedKeyObserver] && obj.asInstanceOf[NamedKeyObserver].name == this.name
    }
  }

  def makeOrderEvent(orderId: String, ric: String, isDeleted: Boolean = false): util.HashMap[String, Any] = {
    val event = new java.util.HashMap[String, Any]()
    event.put("orderId", orderId)
    event.put("ric", ric)
    event.put("currencyPair", "USDGBP")
    event.put("_isDeleted", isDeleted)
    event
  }

  def makeOrders2Event(orderId: String, ric: String, currencyPair: String, isDeleted: Boolean = false): util.HashMap[String, Any] = {
    val event = new java.util.HashMap[String, Any]()
    event.put("orderId", orderId)
    event.put("ric", ric)
    event.put("currencyPair", currencyPair)
    //event.put("instrument.description", "Vodaphone");
    event.put("_isDeleted", isDeleted)
    event
  }

  def makeCurrencyParisEvent(ccyPair: String, rate: Double, isDeleted: Boolean = false): util.HashMap[String, Any] = {
    val event = new java.util.HashMap[String, Any]()
    event.put("currencyPair", ccyPair)
    event.put("_isDeleted", isDeleted)
    event
  }

  def makePricesEvent(ric: String, isDeleted: Boolean = false): util.HashMap[String, Any] = {
    val event = new java.util.HashMap[String, Any]()
    event.put("ric", ric)
    event.put("_isDeleted", isDeleted)
    event
  }

  def makeChildOrdersEvent(orderId: String, childOrderId: String, isDeleted: Boolean = false): util.HashMap[String, Any] = {
    val event = new java.util.HashMap[String, Any]()
    event.put("orderId", orderId)
    event.put("childOrderId", childOrderId)
    event.put("_isDeleted", isDeleted)
    event
  }

  def makeFxEvent(cross: String, isDeleted: Boolean = false): util.HashMap[String, Any] = {
    val event = new java.util.HashMap[String, Any]()
    event.put("cross", cross)
    event.put("_isDeleted", isDeleted)
    event
  }

  def mkeOrdersDef(): TableDef = {
    TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "currencyPair:String"),
      joinFields = "ric", "orderId", "currencyPair")
  }

  def mkeChildOrdersDef(): TableDef = {
    TableDef(
      name = "childOrders",
      keyField = "childOrderId",
      columns = Columns.fromNames("childOrderId:String", "orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "childOrderId", "orderId")
  }

  def mkeOrders2Def(): TableDef = {
    TableDef(
      name = "orders2",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String",
                                          "tradeTime:Long", "quantity:Double", "currencyPair: String"
                ),
      joinFields = "ric", "orderId", "currencyPair")
  }

  def mkeCcyPairDef(): TableDef = {
    TableDef(
      name = "fxRates",
      keyField = "currencyPair",
      columns = Columns.fromNames("currencyPair:String", "fxRate:Double"),
      joinFields = "currencyPair")
  }

  def mkeFxDef(): TableDef = {
    TableDef(
      name = "fx",
      keyField = "cross",
      columns = Columns.fromNames("cross:String", "fxBid:Double", "fxOffer:Double"),
      joinFields = "cross")
  }

  def mkePricesDef(): TableDef = {
    TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")
  }

  def mkeOrderPricesDef(ordersDef: TableDef, pricesDef: TableDef): JoinTableDef = {
    JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFromExceptDefaultColumns(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("orderId", "currencyPair", "ric")
    )
  }

  def mkeOrderPricesFxDef(ordersDef: TableDef, pricesDef: TableDef, fxDef: TableDef): JoinTableDef = {
    JoinTableDef(
      name = "orderPricesFx",
      baseTable = ordersDef,
      joinColumns = Columns.allFromExceptDefaultColumns(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric") ++ Columns.allFromExcept(fxDef, "ric"),
      links = VisualLinks(),
      joinFields = Seq("orderId"),
      JoinTo(
        table = pricesDef,
        joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
      ),
      JoinTo(
        table = fxDef,
        joinSpec = JoinSpec(left = "currencyPair", right = "cross", LeftOuterJoin)
      )
    )
  }

  def mkeChildOrdersToOrderPricesDef(childOrders: TableDef, orderPrices: TableDef): JoinTableDef = {
    JoinTableDef(
      name = "childOrderPrices",
      baseTable = childOrders,
      joinColumns = Columns.allFromExceptDefaultColumns(orderPrices) ++ Columns.allFromExcept(childOrders, "orderId"),
      joins =
        JoinTo(
          table = orderPrices,
          joinSpec = JoinSpec(left = "orderId", right = "orderId", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq()
    )
  }

  def mkeOrder2PricesRatesDef(orders2Def: TableDef, pricesDef: TableDef, fxRates: TableDef): JoinTableDef = {
    JoinTableDef(
      name = "order2PricesAndFx",
      baseTable = orders2Def,
      joinColumns = Columns.allFromExceptDefaultColumns(orders2Def)
        ++ Columns.allFromExcept(pricesDef, "ric")
        ++ Columns.allFromExcept(fxRates, "currencyPair"),
      links = VisualLinks(),
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

  def sendEvent(table: String, event: util.HashMap[String, Any])(implicit joinTableProvider: JoinTableProvider): Unit = {
    joinTableProvider.sendEvent(table, event)
  }

  Feature("Check Join Manager Functionality in table joins") {

    Scenario("Left Outer Join") {

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      implicit val joinTableProvider: JoinTableProvider = new VuuJoinTableProvider()

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
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      implicit val joinTableProvider: JoinTableProvider = new VuuJoinTableProvider()

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

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      implicit val joinTableProvider: JoinTableProvider = new VuuJoinTableProvider()

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

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      implicit val joinTableProvider: JoinTableProvider = new VuuJoinTableProvider()

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

      sendEvent("orders", makeOrderEvent("3", "VOD.L", isDeleted = true))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("3", "VOD.L", true, "VOD.L", false)
        )
      )

      sendEvent("orders", makeOrderEvent("2", "VOD.L", isDeleted = true))

      assertJoins("orderPrices", joinTableProvider)(
        Table(
          ("orders.orderId", "orders.ric", "orders._isDeleted", "prices.ric", "prices._isDeleted"),
          ("2", "VOD.L", true, "VOD.L", false)
        )
      )
    }

    Scenario("Left Outer Join, Delete Right Record") {
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      implicit val joinTableProvider : JoinTableProvider = new VuuJoinTableProvider()

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

      sendEvent("prices", makePricesEvent("VOD.L", isDeleted = true))

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
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      implicit val joinTableProvider: VuuJoinTableProvider = new VuuJoinTableProvider()

      val ordersDef = mkeOrdersDef()
      val pricesDef = mkePricesDef()
      val fxDef = mkeFxDef()

      val orderPricesDef = mkeOrderPricesDef(ordersDef, pricesDef)
      val orderPricesFxDef = mkeOrderPricesFxDef(ordersDef, pricesDef, fxDef)

      val tableContainer = new TableContainer(joinTableProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(orderPricesDef)
      val orderPricesFx = tableContainer.createJoinTable(orderPricesFxDef)

      joinTableProvider.start()

      sendEvent("orders", makeOrderEvent("1", "VOD.L"))
      sendEvent("orders", makeOrderEvent("2", "VOD.L"))
      sendEvent("orders", makeOrderEvent("3", "VOD.L"))
      sendEvent("prices", makePricesEvent("VOD.L"))
      sendEvent("prices", makePricesEvent("BT.L"))
      sendEvent("fx", makeFxEvent("USDGBP"))

      assertJoins("orderPricesFx", joinTableProvider)(
        Table(
          ("orders.orderId","orders.ric","orders._isDeleted","prices.ric","prices._isDeleted","fx.cross","fx._isDeleted","orders.currencyPair"),
          ("1"       ,"VOD.L"   ,false     ,null      ,null      ,null      ,null      ,"USDGBP"  ),
          ("2"       ,"VOD.L"   ,false     ,null      ,null      ,null      ,null      ,"USDGBP"  ),
          ("3"       ,"VOD.L"   ,false     ,null      ,null      ,null      ,null      ,"USDGBP"  ),
          ("1"       ,"VOD.L"   ,false     ,"VOD.L"   ,false     ,null      ,null      ,"USDGBP"  ),
          ("2"       ,"VOD.L"   ,false     ,"VOD.L"   ,false     ,null      ,null      ,"USDGBP"  ),
          ("3"       ,"VOD.L"   ,false     ,"VOD.L"   ,false     ,null      ,null      ,"USDGBP"  ),
          ("1"       ,"VOD.L"   ,false     ,"VOD.L"   ,false     ,"USDGBP"  ,false     ,"USDGBP"  ),
          ("2"       ,"VOD.L"   ,false     ,"VOD.L"   ,false     ,"USDGBP"  ,false     ,"USDGBP"  ),
          ("3"       ,"VOD.L"   ,false     ,"VOD.L"   ,false     ,"USDGBP"  ,false     ,"USDGBP"  )
        )
      )
    }
  }
}
