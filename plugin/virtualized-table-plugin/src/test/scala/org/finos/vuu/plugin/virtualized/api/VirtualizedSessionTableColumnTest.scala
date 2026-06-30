package org.finos.vuu.plugin.virtualized.api

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.GivenWhenThen
import org.scalamock.scalatest.MockFactory
import org.finos.vuu.core.table.RowData

class VirtualizedSessionTableColumnTest extends AnyFeatureSpec
  with Matchers
  with GivenWhenThen
  with MockFactory {

  Feature("Virtualized Session Table Column") {

    Scenario("Parsing valid column definitions from names strings") {
      Given("an array of correctly formatted column definition strings")
      val names = Array("userId:String:remote_user_id", "amount:Double:remote_amount")

      When("parsing them using fromNames")
      val columns = VirtualizedSessionTableColumn.fromNames(names)

      Then("it should return an array containing the correctly mapped columns with sequential indices")
      columns should have length 2

      columns(0).name shouldBe "userId"
      columns(0).index shouldBe 0
      columns(0).remoteName shouldBe "remote_user_id"

      columns(1).name shouldBe "amount"
      columns(1).index shouldBe 1
      columns(1).remoteName shouldBe "remote_amount"
    }

    Scenario("Parsing an invalid column definition string") {
      Given("an array containing an incorrectly formatted string missing parts")
      val badNames = Array("invalid_format_column")

      When("attempting to parse them using fromNames")
      val exception = intercept[Exception] {
        VirtualizedSessionTableColumn.fromNames(badNames)
      }

      Then("it should throw an Exception declaring the format invalid")
      exception.getMessage should include("Invalid format: invalid_format_column")
    }

    Scenario("Retrieving row data from a column instance") {
      Given("a column instance and a mock RowData object")
      val column = VirtualizedSessionTableColumn("price", 0, classOf[java.lang.Double], "remote_price")
      val mockRowData = mock[RowData]
      val expectedValue = 99.99

      And("the row data is stubbed to return a value for the column name")
      (mockRowData.get(_: String)).expects("price").returning(expectedValue).twice()

      When("getData and getDataFullyQualified are invoked")
      val dataResult = column.getData(mockRowData)
      val fullyQualifiedResult = column.getDataFullyQualified(mockRowData)

      Then("both methods should extract and return the correct value from the row data")
      dataResult shouldBe expectedValue
      fullyQualifiedResult shouldBe expectedValue
    }

    Scenario("Verifying equality and hashCode contracts") {
      Given("multiple instances of columns with matching and differing properties")
      val col1 = VirtualizedSessionTableColumn("qty", 0, classOf[java.lang.Integer], "remote_qty")
      val col2 = VirtualizedSessionTableColumn("qty", 0, classOf[java.lang.Integer], "remote_qty") // Identical contents
      val col3 = VirtualizedSessionTableColumn("qty", 0, classOf[java.lang.Integer], "different_remote") // Different remote name
      val nonColumnObj = "Not A Column Instance"

      Then("identical instances should satisfy structural equality and share matching hash codes")
      col1 shouldEqual col2
      col1.hashCode() shouldBe col2.hashCode()

      And("instances with differing structural definitions should not be equal")
      col1 shouldNot equal(col3)

      And("comparisons with entirely separate types should return false")
      col1 shouldNot equal(nonColumnObj)
    }
  }
}