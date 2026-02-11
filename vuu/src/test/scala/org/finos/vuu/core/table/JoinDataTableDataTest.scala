package org.finos.vuu.core.table

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.{Index, Indices, JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef, VisualLinks}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProvider, JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.time.Instant

class JoinDataTableDataTest extends AnyFeatureSpec with Matchers {

  given timeProvider: Clock = new DefaultClock
  given lifecycle: LifecycleContainer = new LifecycleContainer

  given metrics: MetricsProvider = new MetricsProviderImpl

  val orderId = "123456789"
  val orderId2 = "123456788"
  val orderId3 = "123456787"
  val instrumentRic = "VOD.L"
  val instrumentRic2 = "BAES.L"
  val instrumentRic3 = "AIR.PA"
  val orderWithNoInstrument: Map[String, Any] = Map("orderId" -> orderId)
  val orderWithInstrument: Map[String, Any] = Map("orderId" -> orderId, "ric" -> instrumentRic)
  val order1WithInstrument2: Map[String, Any] = Map("orderId" -> orderId, "ric" -> instrumentRic2)
  val order2WithInstrument2: Map[String, Any] = Map("orderId" -> orderId2, "ric" -> instrumentRic2)
  val order3WithInstrument3: Map[String, Any] = Map("orderId" -> orderId3, "ric" -> instrumentRic3)
  val instrument: Map[String, Any] = Map("ric" -> instrumentRic)
  val instrument2: Map[String, Any] = Map("ric" -> instrumentRic2)
  val instrument3: Map[String, Any] = Map("ric" -> instrumentRic3)

  Feature("Test addition of rows") {

    Scenario("Add a new row with no joins") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, orderWithNoInstrument)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldEqual ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> null)
    }

    Scenario("Add a new row with only left hand of join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldEqual ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> null)
    }

    Scenario("Add a new row with complete join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      pricesProvider.tick(instrumentRic, instrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldEqual ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> instrumentRic)
    }

    Scenario("Add several rows") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      pricesProvider.tick(instrumentRic, instrument)
      pricesProvider.tick(instrumentRic2, instrument2)
      pricesProvider.tick(instrumentRic3, instrument3)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, orderWithInstrument)
      orderProvider.tick(orderId2, order2WithInstrument2)
      orderProvider.tick(orderId3, order3WithInstrument3)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldEqual ImmutableArray.from(List(orderId, orderId2, orderId3))
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> instrumentRic)
      result.getKeyValuesByTable(orderId2) shouldEqual Map("orders" -> orderId2, "prices" -> instrumentRic2)
      result.getKeyValuesByTable(orderId3) shouldEqual Map("orders" -> orderId3, "prices" -> instrumentRic3)
    }

  }

  Feature("Test updating rows") {

    Scenario("Update an existing row, from no join to only left hand of join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      orderProvider.tick(orderId, orderWithNoInstrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldBe ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> null)
    }

    Scenario("Update an existing row, from no join to complete join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      pricesProvider.tick(instrumentRic, instrument)
      orderProvider.tick(orderId, orderWithNoInstrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldBe ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> instrumentRic)
    }

    Scenario("Update an existing row, from only left hand of join to no join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, orderWithNoInstrument)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false // primaryKeyToJoinKeys is updated
      result.getPrimaryKeys shouldBe ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> null)
    }

    Scenario("Update an existing row, from only left hand of join to complete join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      pricesProvider.tick(instrumentRic, instrument)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldBe ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> instrumentRic)
    }

    Scenario("Update an existing row, from complete join to only left hand") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      pricesProvider.tick(instrumentRic, instrument)
      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, order1WithInstrument2)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldBe ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> null)
      // TODO https://github.com/finos/vuu/issues/2019
      // in this scenario, RightToLeftKeys still has the old pairing of orderId 123456789 and ric VOD.L, i.e. memory leak
    }

    Scenario("Update an existing row, from complete join to no join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      pricesProvider.tick(instrumentRic, instrument)
      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.tick(orderId, orderWithNoInstrument)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      (result eq original) shouldBe false
      result.getPrimaryKeys shouldBe ImmutableArray.of(orderId)
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> null)
    }

  }

  Feature("Test deletion of rows") {

    Scenario("Delete when row doesn't exist returns original") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      val original = orderPrices.getJoinData

      orderProvider.delete(orderId)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      result shouldEqual original
    }

    Scenario("Delete row with no joins") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      orderProvider.tick(orderId, orderWithNoInstrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.delete(orderId)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      result should not equal original
      result.getPrimaryKeys shouldBe empty
      result.getKeyValuesByTable(orderId) shouldEqual null
    }

    Scenario("Delete row with only left hand of join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      orderProvider.tick(orderId, orderWithInstrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.delete(orderId)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      result should not equal original
      result.getPrimaryKeys shouldBe empty
      result.getKeyValuesByTable(orderId) shouldEqual null
    }

    Scenario("Delete row with complete join") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      orderProvider.tick(orderId, orderWithInstrument)
      pricesProvider.tick(instrumentRic, instrument)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.delete(orderId)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      result should not equal original
      result.getPrimaryKeys shouldBe empty
      result.getKeyValuesByTable(orderId) shouldEqual null
    }

    Scenario("Delete row from middle of table") {
      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins
      orderProvider.tick(orderId, orderWithInstrument)
      orderProvider.tick(orderId2, order2WithInstrument2)
      orderProvider.tick(orderId3, order3WithInstrument3)
      pricesProvider.tick(instrumentRic, instrument)
      pricesProvider.tick(instrumentRic2, instrument2)
      pricesProvider.tick(instrumentRic3, instrument3)
      joinProvider.runOnce()
      val original = orderPrices.getJoinData

      orderProvider.delete(orderId2)
      joinProvider.runOnce()
      val result = orderPrices.getJoinData

      result should not equal original
      result.getPrimaryKeys shouldEqual ImmutableArray.from(List(orderId, orderId3))
      result.getKeyValuesByTable(orderId) shouldEqual Map("orders" -> orderId, "prices" -> instrumentRic)
      result.getKeyValuesByTable(orderId2) shouldEqual null
      result.getKeyValuesByTable(orderId3) shouldEqual Map("orders" -> orderId3, "prices" -> instrumentRic3)
    }

  }

  Feature("Test a big number of operations") {

    Scenario("Inserts, updates and deletes") {

      val (joinProvider, orders, orderProvider, prices, pricesProvider, orderPrices) = setupJoins

      info(s"${Instant.now} Beginning inserts and updates...")

      for (a <- 0 until 10_000) {
        val orderId = s"$a"
        val instrumentRic = s"ric-$a"
        val orderMap = Map("orderId" -> orderId, "ric" -> instrumentRic)
        val instrumentMap = Map("ric" -> instrumentRic)
        orderProvider.tick(orderId, orderMap)
        pricesProvider.tick(instrumentRic, instrumentMap)

        //updates
        for (a <- 0 until 4) {
          orderProvider.tick(orderId, orderMap)
          pricesProvider.tick(instrumentRic, instrumentMap)
        }
        joinProvider.runOnce()
      }

      info(s"${Instant.now} Beginning deletion...")

      for (a <- 0 until 10_000) {
        val orderId = s"$a"
        val instrumentRic = s"ric-$a"
        orderProvider.delete(orderId)
        pricesProvider.delete(instrumentRic)
        joinProvider.runOnce()
      }

      info(s"${Instant.now} Deletion complete")
    }


  }

  private def setupJoins(using lifecycleContainer: LifecycleContainer, timeProvider: Clock, metrics: MetricsProvider):
  (JoinTableProvider, DataTable, MockProvider, DataTable, MockProvider, JoinTable) = {

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      indices = Indices(Index("orderId"), Index("trader")),
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "ric", "orderId")

    val pricesDef = TableDef(
      name = "prices",
      keyField = "ric",
      indices = Indices(Index("ric"), Index("open")),
      columns = Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"),
      joinFields = "ric")

    val joinDef = JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq()
    )

    val joinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val orderPrices = tableContainer.createJoinTable(joinDef)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)

    val providerContainer = new ProviderContainer(joinProvider)
    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)

    (joinProvider, orders, ordersProvider, prices, pricesProvider, orderPrices)
  }

}
