package org.finos.vuu.net.rpc.sessiontable

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class TableActionTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("TableAction conversion and validation") {

    Scenario("Successfully parsing an AddRow table action from external string") {
      Given("the external string for add row (\"addRow\")")
      val input = "addRow"

      When("fromExternal is invoked")
      val result = TableAction.fromExternal(input)

      Then("it should return TableAction.AddRow")
      result shouldBe TableAction.AddRow
    }

    Scenario("Successfully parsing an EditCell table action from external string") {
      Given("the external string for edit cell (\"editCell\")")
      val input = "editCell"

      When("fromExternal is invoked")
      val result = TableAction.fromExternal(input)

      Then("it should return TableAction.EditCell")
      result shouldBe TableAction.EditCell
    }

    Scenario("Successfully parsing a DeleteRow table action from external string") {
      Given("the external string for delete row (\"deleteRow\")")
      val input = "deleteRow"

      When("fromExternal is invoked")
      val result = TableAction.fromExternal(input)

      Then("it should return TableAction.DeleteRow")
      result shouldBe TableAction.DeleteRow
    }

    Scenario("Throwing an exception when parsing an invalid external string") {
      Given("an unsupported external string")
      val invalidInput = "unknownAction"

      When("fromExternal is invoked")
      Then("an IllegalArgumentException should be thrown")
      val exception = intercept[IllegalArgumentException] {
        TableAction.fromExternal(invalidInput)
      }
      exception.getMessage should include("Invalid TableAction: unknownAction")
    }

    Scenario("Validating strings correctly with isValid") {
      Given("a mix of valid and invalid external table action strings")

      When("isValid is checked for valid actions")
      Then("it should return true for all valid entries")
      TableAction.isValid("addRow") shouldBe true
      TableAction.isValid("editCell") shouldBe true
      TableAction.isValid("deleteRow") shouldBe true

      When("isValid is checked for an invalid string")
      Then("it should return false")
      TableAction.isValid("invalidAction") shouldBe false
    }
  }
}
