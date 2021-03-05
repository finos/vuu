package io.venuu.vuu.provider.simulation

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.text.AsciiUtil
import io.venuu.toolbox.time.TestFriendlyClock
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.table.{Columns, SimpleDataTable}
import io.venuu.vuu.provider.TestFriendlyJoinTableProvider
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

/**
  * Created by chris on 21/12/2015.
  */
class SimulatedPricesProviderTest extends AnyFeatureSpec with Matchers {

  final val TEST_TIME = 1450770869442l

  private def printTable(provider: SimulatedPricesProvider): Unit = {
    val columns = provider.table.getTableDef.columns
    val headers = columns.map(_.name)
    val keys    = provider.table.primaryKeys

    val data = keys.toArray.map(key => provider.table.pullRowAsArray(key, columns.toList) )

    println("\n\n data")
    println(AsciiUtil.asAsciiTable(headers, data))
  }

  def getDef = {

    val pricesDef = TableDef("prices", "ric",
        Columns.fromNames("ric:String", "bid:Double", "ask:Double", "bidSize: Double", "askSize:Double", "last:Double", "open:Double", "close:Double", "scenario: String"),
      "ric")

    pricesDef
  }

  Feature("check simulated provider"){

    Scenario("check basic operation works"){

      implicit val timeProvider = new TestFriendlyClock(TEST_TIME)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val lifecycleContainer = new LifecycleContainer

      val joinProvider = new TestFriendlyJoinTableProvider

      val pricesDef = getDef

      val table = new SimpleDataTable(pricesDef, joinProvider)

      val provider = new SimulatedPricesProvider(table)

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

}
