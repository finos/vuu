package org.finos.vuu.net.row

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RowUpdateTypeTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("RowUpdateType conversion and validation") {

    Scenario("Successfully parsing a SizeOnly row update type from external string") {
      Given("the external string for size only (\"SIZE\")")
      val input = "SIZE"

      When("fromExternal is invoked")
      val result = RowUpdateType.fromExternal(input)

      Then("it should return RowUpdateType.SizeOnly")
      result shouldBe RowUpdateType.SizeOnly
    }

    Scenario("Successfully parsing an Update row update type from external string") {
      Given("the external string for update (\"U\")")
      val input = "U"

      When("fromExternal is invoked")
      val result = RowUpdateType.fromExternal(input)

      Then("it should return RowUpdateType.Update")
      result shouldBe RowUpdateType.Update
    }

    Scenario("Throwing an exception when parsing an invalid external string") {
      Given("an unsupported external string")
      val invalidInput = "INVALID"

      When("fromExternal is invoked")
      Then("an IllegalArgumentException should be thrown")
      val exception = intercept[IllegalArgumentException] {
        RowUpdateType.fromExternal(invalidInput)
      }
      exception.getMessage should include("Invalid row update type: INVALID")
    }

    Scenario("Validating strings correctly with isValid") {
      Given("a mix of valid and invalid external strings")

      When("isValid is checked for \"SIZE\" and \"U\"")
      Then("it should return true for both")
      RowUpdateType.isValid("SIZE") shouldBe true
      RowUpdateType.isValid("U") shouldBe true

      When("isValid is checked for an invalid string like \"XYZ\"")
      Then("it should return false")
      RowUpdateType.isValid("XYZ") shouldBe false
    }
  }
}
