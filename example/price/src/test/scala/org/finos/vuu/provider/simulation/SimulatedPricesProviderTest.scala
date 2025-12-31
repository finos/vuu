package org.finos.vuu.provider.simulation

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.text.AsciiUtil
import org.finos.toolbox.time.TestFriendlyClock
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{Columns, InMemDataTable, ViewPortColumnCreator}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.language.postfixOps


class SimulatedPricesProviderTest extends AnyFeatureSpec with Matchers {

  final val TEST_TIME = 1450770869442L

  private def printTable(provider: SimulatedPricesProvider): Unit = {
    val columns = provider.table.getTableDef.getColumns
    val headers = columns.map(_.name)
    val keys = provider.table.primaryKeys

    val data = keys.toArray.map(key => provider.table.pullRowAsArray(key, ViewPortColumnCreator.create(provider.table, columns.map(_.name).toList)))

    println("\n\n data")
    println(AsciiUtil.asAsciiTable(headers, data))
  }

  def getDef: TableDef = {

    val pricesDef = TableDef("prices", "ric",
      Columns.fromNames("ric:String", "bid:Double", "ask:Double", "bidSize: Double", "askSize:Double", "last:Double", "open:Double", "close:Double", "scenario: String"),
      "ric")

    pricesDef
  }

  implicit val timeProvider: TestFriendlyClock = new TestFriendlyClock(TEST_TIME)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val lifecycleContainer: LifecycleContainer = new LifecycleContainer
  val joinProvider = new TestFriendlyJoinTableProvider
  val pricesDef = getDef
  val table = new InMemDataTable(pricesDef, joinProvider)
  val provider = new SimulatedPricesProvider(table)

  Feature("check simulated provider") {

    Scenario("check basic operation works") {
      provider.subscribe("VOD.L")

      timeProvider.advanceBy(10)

      provider.subscribe("BT.L")
      timeProvider.advanceBy(1001)
      provider.runOnce()
      timeProvider.advanceBy(1001)
      provider.runOnce()
      printTable(provider)

      provider.subscribe("AAPL.OQ")
      provider.runOnce()
      provider.runOnce()
      printTable(provider)

      timeProvider.advanceBy(100001)

      provider.runOnce()
      printTable(provider)

      provider.runOnce()
      printTable(provider)
    }
  }

  Feature("calculating min/max bid and min/max ask") {
    val priceMaxDelta = 5.0
    val spreadMultipler = 10.0
    val currentBid = 100.0
    val currentAsk = 102.0
    Scenario("delta of min bid and current bid should be smaller than or equal to price max delta") {
      val minBid = provider.minBid(currentBid, currentAsk, spreadMultipler, priceMaxDelta)
      assert((currentBid - minBid).abs <= priceMaxDelta)
    }

    Scenario("delta of max bid and current bid should be smaller than or equal to price max delta") {
      val maxBid = provider.maxBid(currentBid, currentAsk, spreadMultipler, priceMaxDelta)
      assert((maxBid - currentBid).abs <= priceMaxDelta)
    }

    Scenario("delta of min ask and current ask should be smaller than or equal to price max delta") {
      val minAsk = provider.minAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta)
      assert((currentAsk - minAsk).abs <= priceMaxDelta)
    }

    Scenario("delta of max ask and current ask should be smaller than or equal to price max delta") {
      val maxAsk = provider.maxAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta)
      assert((maxAsk - currentAsk).abs <= priceMaxDelta)
    }

    Scenario("min bid equals to current bid when current bid ask are too small, and min bid becomes negative") {
      val currentBid = 0.1
      val currentAsk = 0.2
      val minBid = provider.minBid(currentBid, currentAsk, spreadMultipler, priceMaxDelta)
      minBid shouldBe currentBid
    }

    Scenario("max bid equals to current bid + 1 when current bid ask are zero, and max bid becomes negative") {
      val currentBid = 0
      val currentAsk = 0
      val maxBid = provider.maxBid(currentBid, currentAsk, spreadMultipler, priceMaxDelta)
      maxBid shouldBe currentBid + 1
    }
  }

  Feature("basic checking for new bid and ask") {
    val priceMaxDelta = 5.0
    val spreadMultipler = 10.0
    val currentBid = 100.0
    val currentAsk = 102.0

    Scenario("bid is not null") {
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler,priceMaxDelta, provider.nextRandomDouble)
      bid should not equal null
    }

    Scenario("ask is not null") {
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler,priceMaxDelta, provider.nextRandomDouble)
      ask should not equal null
    }

    Scenario("bid should be smaller than ask") {
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler,priceMaxDelta, provider.nextRandomDouble)
      assert(bid < ask)
    }

    Scenario("bid move delta should be smaller or equal to max delta") {
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler,priceMaxDelta, provider.nextRandomDouble)
      assert((bid - currentBid).abs <= priceMaxDelta)
    }

    Scenario("ask move delta should be smaller or equal to max delta") {
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler,priceMaxDelta, provider.nextRandomDouble)
      assert((ask - currentAsk).abs <= priceMaxDelta)
    }

  }

  Feature("init bid and ask") {
    val priceMaxDelta = 5.0
    val spreadMultipler = 10.0

    def randomAlwaysGiveMin(min: Double, max: Double) = min

    def randomAlwaysGiveMax(min: Double, max: Double) = max

    Scenario("bid should be when random gives min") {
      val (bid: Double, ask: Double) = provider.initBidAsk(5,randomAlwaysGiveMin)
      bid shouldBe 0
    }

    Scenario("ask should be when random gives min") {
      val (bid: Double, ask: Double) = provider.initBidAsk(5,randomAlwaysGiveMin)
      ask shouldBe 1
    }

    Scenario("bid should be when random gives max") {
      val (bid: Double, ask: Double) = provider.initBidAsk(5, randomAlwaysGiveMax)
      bid shouldBe 999
    }

    Scenario("ask should be when random gives max") {
      val (bid: Double, ask: Double) = provider.initBidAsk(5, randomAlwaysGiveMax)
      ask shouldBe 1005
    }
  }

  Feature("generate bid and ask") {
    val priceMaxDelta = 5.0
    val spreadMultipler = 10.0
    val currentBid = 100.0
    val currentAsk = 102.0

    def randomAlwaysGiveMin(min: Double, max: Double) = min

    def randomAlwaysGiveMax(min: Double, max: Double) = max

    Scenario("new bid is min bid when random always give min") {
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, randomAlwaysGiveMin)
      bid shouldBe 96.0
    }

    Scenario("new bid is max bid when random always give max") {
      val currentMid = (currentAsk - currentBid) / 2 + currentBid
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, randomAlwaysGiveMax)
      bid shouldBe currentMid
    }

    Scenario("new ask is min ask when random always give min") {
      val currentMid = (currentAsk - currentBid) / 2 + currentBid
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, randomAlwaysGiveMin)
      ask shouldBe currentMid
    }

    Scenario("new ask is max bid when random always give max") {
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, randomAlwaysGiveMax)
      ask shouldBe 106.0
    }

    Scenario("move bid and ask away when current bid equals current ask and random is always max") {
      val currentBid = 100.0
      val currentAsk = 100.0
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, randomAlwaysGiveMax)
      bid shouldBe 100.0
      ask shouldBe 105.5
    }

    Scenario("move bid and ask away when current bid equals current ask and random is always min") {
      val currentBid = 100.0
      val currentAsk = 100.0
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, randomAlwaysGiveMin)
      bid shouldBe 95.5
      ask shouldBe 101.0
    }

    Scenario("able to generate bid and ask when current bid equals to current ask") {
      val currentBid = 100.0
      val currentAsk = 100.0
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, provider.nextRandomDouble)
      assert(bid != ask)
    }

    Scenario("able to generate bid and ask when different between current bid and current ask is smaller than 1") {
      val currentBid = 60.037092313809325
      val currentAsk = 60.08621991205602
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, provider.nextRandomDouble)
      assert(bid != ask)
    }

    Scenario("able to generate bid and ask when different between current bid and current ask equals to 1") {
      val currentBid = 0
      val currentAsk = 1
      val (bid: Double, ask: Double) = provider.generateNextBidAsk(currentBid, currentAsk, spreadMultipler, priceMaxDelta, provider.nextRandomDouble)
      assert(bid != ask)
    }
  }

}
