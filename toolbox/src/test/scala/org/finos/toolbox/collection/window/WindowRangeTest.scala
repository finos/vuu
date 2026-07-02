package org.finos.toolbox.collection.window

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.GivenWhenThen

class WindowRangeTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("WindowRange Bound Calculations and Validations") {

    Scenario("Enforcing structural integrity during instantiation") {
      Given("a valid range specification where 'from' is less than 'to'")
      val validRange = new WindowRange(10, 20)

      Then("the fields must be properly initialized")
      validRange.from shouldBe 10
      validRange.to shouldBe 20

      When("attempting to initialize an invalid range where 'from' exceeds 'to'")
      Then("an IllegalArgumentException must be proactively thrown")
      an [IllegalArgumentException] should be thrownBy {
        new WindowRange(25, 10)
      }
    }

    Scenario("Evaluating whether an index falls within exclusive upper bounds") {
      Given("a WindowRange defined explicitly as spanning [5, 10)")
      val range = new WindowRange(5, 10)

      When("checking the exact lower boundary index (5)")
      Then("it must return true (inclusive lower bound)")
      range.isWithin(5) shouldBe true

      When("checking an index below the lower boundary (4)")
      Then("it must return false")
      range.isWithin(4) shouldBe false

      When("checking the exact upper boundary index (10)")
      Then("it must return false (exclusive upper bound)")
      range.isWithin(10) shouldBe false

      When("checking a valid midpoint index (7)")
      Then("it must return true")
      range.isWithin(7) shouldBe true
    }

    Scenario("Calculating overlap intersection coordinates across varying target ranges") {
      Given("a reference WindowRange defined as [10, 20)")
      val referenceRange = new WindowRange(10, 20)

      When("the target range is a subset nested completely inside [12, 17)")
      val (oFrom1, oTo1) = referenceRange.overlap(12, 17)
      Then("the overlap coordinates must match the target range exactly")
      oFrom1 shouldBe 12
      oTo1 shouldBe 17

      When("the target range partially overlaps on the left border [5, 15)")
      val (oFrom2, oTo2) = referenceRange.overlap(5, 15)
      Then("the intersection must clamp tightly to the reference lower bound")
      oFrom2 shouldBe 10
      oTo2 shouldBe 15

      When("the target range partially overlaps on the right border [15, 25)")
      val (oFrom3, oTo3) = referenceRange.overlap(15, 25)
      Then("the intersection must clamp tightly to the reference upper bound")
      oFrom3 shouldBe 15
      oTo3 shouldBe 20

      When("the target range is strictly adjacent on the left border [0, 10) (Bug 4 Check)")
      val (oFrom4, oTo4) = referenceRange.overlap(0, 10)
      Then("the calculation must cleanly treat them as disjoint and return an empty span (0, 0)")
      oFrom4 shouldBe 0
      oTo4 shouldBe 0

      When("the target range is strictly adjacent on the right border [20, 30)")
      val (oFrom5, oTo5) = referenceRange.overlap(20, 30)
      Then("the calculation must cleanly treat them as disjoint and return an empty span (0, 0)")
      oFrom5 shouldBe 0
      oTo5 shouldBe 0

      When("the target range is completely disconnected/distant [40, 50)")
      val (oFrom6, oTo6) = referenceRange.overlap(40, 50)
      Then("the intersection must return an empty span (0, 0)")
      oFrom6 shouldBe 0
      oTo6 shouldBe 0
    }
  }
}
