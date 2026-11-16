package org.finos.vuu.core.sort

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class SortDirectionTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("SortDirection conversion and validation") {

    Scenario("Successfully parsing a Descending sort direction from external char") {
      Given("the external character for descending ('D')")
      val input = 'D'

      When("fromExternal is invoked")
      val result = SortDirection.fromExternal(input)

      Then("it should return SortDirection.Descending")
      result shouldBe SortDirection.Descending
    }

    Scenario("Successfully parsing an Ascending sort direction from external char") {
      Given("the external character for ascending ('A')")
      val input = 'A'

      When("fromExternal is invoked")
      val result = SortDirection.fromExternal(input)

      Then("it should return SortDirection.Ascending")
      result shouldBe SortDirection.Ascending
    }

    Scenario("Throwing an exception when parsing an invalid external character") {
      Given("an unsupported external character")
      val invalidInput = 'X'

      When("fromExternal is invoked")
      Then("an IllegalArgumentException should be thrown")
      val exception = intercept[IllegalArgumentException] {
        SortDirection.fromExternal(invalidInput)
      }
      exception.getMessage should include("Invalid sort direction: X")
    }

    Scenario("Validating characters correctly with isValid") {
      Given("a mix of valid and invalid external characters")

      When("isValid is checked for 'D' and 'A'")
      Then("it should return true for both")
      SortDirection.isValid('D') shouldBe true
      SortDirection.isValid('A') shouldBe true

      When("isValid is checked for an invalid character like 'Z'")
      Then("it should return false")
      SortDirection.isValid('Z') shouldBe false
    }
  }
}
