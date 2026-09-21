package org.finos.vuu.plugin.virtualized.table.range

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class VirtualizedRangeTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("VirtualizedRange bounds and inclusion check") {

    Scenario("Checking indices within valid range bounds") {
      Given("a VirtualizedRange from 10 to 20")
      val range = VirtualizedRange(10, 20)

      When("checking an index strictly inside the range")
      val containsMid = range.contains(15)

      Then("contains should return true")
      containsMid shouldBe true
    }

    Scenario("Checking boundary conditions (inclusive start, exclusive end)") {
      Given("a VirtualizedRange from 10 to 20")
      val range = VirtualizedRange(10, 20)

      When("evaluating start boundary, end boundary, and adjacent values")
      val containsStart = range.contains(10)
      val containsBeforeStart = range.contains(9)
      val containsJustBeforeEnd = range.contains(19)
      val containsEnd = range.contains(20)

      Then("the start index (10) should be included (inclusive)")
      containsStart shouldBe true

      And("indices before start (9) should be excluded")
      containsBeforeStart shouldBe false

      And("the last valid index (19) should be included")
      containsJustBeforeEnd shouldBe true

      And("the end index (20) should be excluded (exclusive)")
      containsEnd shouldBe false
    }

    Scenario("Handling empty or inverted ranges") {
      Given("an empty range where from == to")
      val emptyRange = VirtualizedRange(10, 10)

      Then("contains should return false for the boundary index")
      emptyRange.contains(10) shouldBe false

      Given("an inverted range where from > to")
      val invertedRange = VirtualizedRange(20, 10)

      Then("contains should return false for values between the boundaries")
      invertedRange.contains(15) shouldBe false
    }
  }
}