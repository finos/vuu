package org.finos.vuu.net.rpc.sessiontable

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class SessionTableCopyOptionTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("SessionTableCopyOption conversion and validation") {

    Scenario("Successfully parsing an All copy option from external string") {
      Given("the external string for all (\"All\")")
      val input = "All"

      When("fromExternal is invoked")
      val result = SessionTableCopyOption.fromExternal(input)

      Then("it should return SessionTableCopyOption.All")
      result shouldBe SessionTableCopyOption.All
    }

    Scenario("Successfully parsing a Selected copy option from external string") {
      Given("the external string for selected (\"Selected\")")
      val input = "Selected"

      When("fromExternal is invoked")
      val result = SessionTableCopyOption.fromExternal(input)

      Then("it should return SessionTableCopyOption.Selected")
      result shouldBe SessionTableCopyOption.Selected
    }

    Scenario("Successfully parsing an Empty copy option from external string") {
      Given("the external string for empty (\"Empty\")")
      val input = "Empty"

      When("fromExternal is invoked")
      val result = SessionTableCopyOption.fromExternal(input)

      Then("it should return SessionTableCopyOption.Empty")
      result shouldBe SessionTableCopyOption.Empty
    }

    Scenario("Throwing an exception when parsing an invalid external string") {
      Given("an unsupported external string")
      val invalidInput = "InvalidOption"

      When("fromExternal is invoked")
      Then("an IllegalArgumentException should be thrown")
      val exception = intercept[IllegalArgumentException] {
        SessionTableCopyOption.fromExternal(invalidInput)
      }
      exception.getMessage should include("Invalid SessionTableCopyOption: InvalidOption")
    }

    Scenario("Validating strings correctly with isValid") {
      Given("a mix of valid and invalid external copy option strings")

      When("isValid is checked for valid options")
      Then("it should return true for all valid entries")
      SessionTableCopyOption.isValid("All") shouldBe true
      SessionTableCopyOption.isValid("Selected") shouldBe true
      SessionTableCopyOption.isValid("Empty") shouldBe true

      When("isValid is checked for an invalid string")
      Then("it should return false")
      SessionTableCopyOption.isValid("InvalidOption") shouldBe false
    }
  }
}
