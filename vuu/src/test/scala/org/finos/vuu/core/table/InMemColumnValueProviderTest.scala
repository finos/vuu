package org.finos.vuu.core.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class InMemColumnValueProviderTest extends AnyFeatureSpec with Matchers {

  implicit val clock: Clock = new TestFriendlyClock(10001L)
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
  implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

  private val pricesDef: TableDef = TableDef(
    "prices",
    "ric",
    Columns.fromNames("ric:String", "bid:Double", "ask:Double"),
  )

  Feature("InMemColumnValueProvider") {

    Scenario("Get all unique value of a given column") {

      val joinProvider = JoinTableProviderImpl()
      val table = new InMemDataTable(pricesDef, joinProvider)
      val provider = new MockProvider(table)
      val columnValueProvider = new InMemColumnValueProvider(table)

      provider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))
      provider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500, "ask" -> 550))
      provider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 240, "ask" -> 244))

      val uniqueValues = columnValueProvider.getUniqueValues("ric")

      uniqueValues shouldBe Array("BT.L", "VOD.L")
    }


    Scenario("Get all unique value of a given column that starts with specified string") {

      val joinProvider = JoinTableProviderImpl()
      val table = new InMemDataTable(pricesDef, joinProvider)
      val provider = new MockProvider(table)
      val columnValueProvider = new InMemColumnValueProvider(table)

      provider.tick("VOA.L", Map("ric" -> "VOA.L", "bid" -> 220, "ask" -> 223))
      provider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500, "ask" -> 550))
      provider.tick("VOV.L", Map("ric" -> "VOV.L", "bid" -> 240, "ask" -> 244))

      val uniqueValues = columnValueProvider.getUniqueValuesStartingWith("ric", "VO")

      uniqueValues shouldBe Array("VOA.L", "VOV.L")
    }

    //todo match for start with string should not be case sensitive
  }
}
