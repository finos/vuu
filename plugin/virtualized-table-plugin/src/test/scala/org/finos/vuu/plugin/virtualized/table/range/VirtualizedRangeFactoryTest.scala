package org.finos.vuu.plugin.virtualized.table.range

import org.finos.vuu.viewport.ViewPortRange
import org.scalamock.scalatest.MockFactory
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class VirtualizedRangeFactoryTest extends AnyFeatureSpec
  with Matchers
  with GivenWhenThen
  with MockFactory {

  Feature("Virtualized Range Factory") {

    Scenario("Calculating dynamic window size for small table size") {
      Given("a table size smaller than the min threshold (20k)")
      val range = ViewPortRange(1000, 1100)
      val tableSize = 10000L // < 20,000

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, tableSize)

      Then("the window size applied should be the minimum (1000)")
      // requestedStart = max(1000 - 1000, 0) = 0
      // requestedEnd = 1100 + 1000 = 2100
      result shouldEqual VirtualizedRange(0, 2100)
    }

    Scenario("Calculating dynamic window size for huge table size") {
      Given("a table size larger than the max threshold (1B)")
      val range = ViewPortRange(1000, 1100)
      val tableSize = 2000000000L // > 1,000,000,000

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, tableSize)

      Then("the window size applied should be the maximum (10,000)")
      // requestedStart = max(1000 - 10000, 0) = 0
      // requestedEnd = 1100 + 10000 = 11100
      result shouldEqual VirtualizedRange(0, 11100)
    }

    Scenario("Calculating dynamic window size for medium table size") {
      Given("a table size between thresholds")
      val range = ViewPortRange(20000, 20100)
      val tableSize = 10000000L // Between 20k and 1B

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, tableSize)

      Then("the window size should scale logarithmically between 500 and 10,000")
      val windowSize = result.to - 20100
      windowSize should be > 500
      windowSize should be < 10000
      
      // Also check requestedStart
      result.from shouldEqual Math.max(20000 - windowSize, 0)
    }

  }
}
