package org.finos.vuu.core.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider}
import org.scalamock.scalatest.MockFactory
import org.scalatest.Assertions
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class InMemColumnValueProviderTest extends AnyFeatureSpec with Matchers with MockFactory  {

  implicit val clock: Clock = new TestFriendlyClock(10001L)
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
  implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl
  private val pricesDef: TableDef = TableDef(
    "prices",
    "id",
    Columns.fromNames("id:Long", "ric:String", "bid:Double", "ask:Double"),
  )

  Feature("InMemColumnValueProvider") {

    Scenario("Get all unique value of a given column") {
      val table = givenTable(pricesDef)
      val provider = new MockProvider(table)
      val columnValueProvider = new InMemColumnValueProvider(table)

      provider.tick("1", Map("id" -> "1", "ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> "BT.L", "bid" -> 500, "ask" -> 550))
      provider.tick("3", Map("id" -> "3", "ric" -> "VOD.L", "bid" -> 240, "ask" -> 244))

      val uniqueValues = columnValueProvider.getUniqueValues("ric")

      uniqueValues should contain theSameElementsAs Vector("BT.L", "VOD.L")
    }

    Scenario("Get all unique value of a given column filtering out null") {
      val table = givenTable(pricesDef)
      val provider = new MockProvider(table)
      val columnValueProvider = new InMemColumnValueProvider(table)

      provider.tick("1", Map("id" -> "1", "ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> null, "bid" -> 500, "ask" -> 550))
      provider.tick("3", Map("id" -> "3", "ric" ->  "VOD.L", "bid" -> 240, "ask" -> 244))

      val uniqueValues = columnValueProvider.getUniqueValues("ric")

      uniqueValues should contain theSameElementsAs Vector("VOD.L")

    }

    Scenario("Get all unique value of a given column returns empty when all values are null") {
      val table = givenTable(pricesDef)
      val provider = new MockProvider(table)
      val columnValueProvider = new InMemColumnValueProvider(table)

      provider.tick("1", Map("id" -> "1", "ric" -> null, "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> null, "bid" -> 500, "ask" -> 550))

      val uniqueValues = columnValueProvider.getUniqueValues("ric")

      uniqueValues shouldBe empty
    }

    Scenario("Get all unique value of a given column that starts with specified string") {
      val table = givenTable(pricesDef)
      val provider = new MockProvider(table)
      val columnValueProvider = new InMemColumnValueProvider(table)

      provider.tick("1", Map("id" -> "1", "ric" -> "VOA.L", "bid" -> 220, "ask" -> 223))
      provider.tick("2", Map("id" -> "2", "ric" -> "BT.L", "bid" -> 500, "ask" -> 550))
      provider.tick("3", Map("id" -> "3", "ric" -> "VOV.L", "bid" -> 240, "ask" -> 244))
      provider.tick("4", Map("id" -> "4", "ric" -> null, "bid" -> 240, "ask" -> 244))

      val uniqueValues = columnValueProvider.getUniqueValuesStartingWith("ric", "VO")

      uniqueValues should contain theSameElementsAs Vector("VOA.L", "VOV.L")
    }

  }

  private def givenTable(tableDef: TableDef): InMemDataTable = new InMemDataTable(tableDef, JoinTableProviderImpl())
}
