package org.finos.vuu.plugin.virtualized.table.range

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.GivenWhenThen
import org.scalamock.scalatest.MockFactory
import org.finos.vuu.viewport.ViewPortRange

class VirtualizedRangeFactoryTest extends AnyFeatureSpec
  with Matchers
  with GivenWhenThen
  with MockFactory {

  Feature("Virtualized Range Factory") {

    Scenario("Validating range against maxRangeDepth limit") {
      Given("a viewport range that exceeds the maxRangeDepth limit")
      val range = ViewPortRange(0, 1001)
      val options = MaxRangeOptions(maxRangeEnd = Some(1000), maxRangeWidth = None)
      val tableSize = 1000L

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, options, tableSize)

      Then("it should return an empty range (0, 0)")
      result shouldEqual VirtualizedRange(0, 0)
    }

    Scenario("Validating range against maxRangeWidth limit") {
      Given("a viewport range whose width exceeds the maxRangeWidth limit")
      val range = ViewPortRange(1000, 2001)
      val options = MaxRangeOptions(maxRangeEnd = None, maxRangeWidth = Some(1000))
      val tableSize = 10000L

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, options, tableSize)

      Then("it should return an empty range (0, 0)")
      result shouldEqual VirtualizedRange(0, 0)
    }

    Scenario("Calculating dynamic window size for small table size") {
      Given("a table size smaller than the min threshold (20k)")
      val range = ViewPortRange(1000, 1100)
      val options = NoRangeOptions
      val tableSize = 10000L // < 20,000

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, options, tableSize)

      Then("the window size applied should be the minimum (1000)")
      // requestedStart = max(1000 - 1000, 0) = 0
      // requestedEnd = 1100 + 1000 = 2100
      result shouldEqual VirtualizedRange(0, 2100)
    }

    Scenario("Calculating dynamic window size for huge table size") {
      Given("a table size larger than the max threshold (1B)")
      val range = ViewPortRange(1000, 1100)
      val options = NoRangeOptions
      val tableSize = 2000000000L // > 1,000,000,000

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, options, tableSize)

      Then("the window size applied should be the maximum (10,000)")
      // requestedStart = max(1000 - 10000, 0) = 0
      // requestedEnd = 1100 + 10000 = 11100
      result shouldEqual VirtualizedRange(0, 11100)
    }

    Scenario("Calculating dynamic window size for medium table size") {
      Given("a table size between thresholds")
      val range = ViewPortRange(20000, 20100)
      val options = NoRangeOptions
      val tableSize = 10000000L // Between 20k and 1B

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, options, tableSize)

      Then("the window size should scale logarithmically between 500 and 10,000")
      val windowSize = result.to - 20100
      windowSize should be > 500
      windowSize should be < 10000
      
      // Also check requestedStart
      result.from shouldEqual Math.max(20000 - windowSize, 0)
    }

    Scenario("Constraining end index by maxDepth") {
      Given("a max depth that is smaller than the requested end")
      val range = ViewPortRange(0, 100)
      val options = MaxRangeOptions(maxRangeEnd = Some(400), maxRangeWidth = None)
      val tableSize = 10000L // Min window size of 500

      When("building the virtualized range")
      val result = VirtualizedRangeFactory.build(range, options, tableSize)

      Then("the resulting range to index should be constrained by maxDepth")
      // requestedEnd would be 100 + 500 = 600. maxDepth is 400.
      result.to shouldEqual 400
      result.from shouldEqual 0
    }
  }
}
