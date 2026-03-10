package org.finos.vuu.api

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.GivenWhenThen
import org.scalatest.prop.TableDrivenPropertyChecks

class ColumnBuilderTest extends AnyFeatureSpec with Matchers with GivenWhenThen with TableDrivenPropertyChecks {

  Feature("ColumnBuilder") {

    val columnTypes = Table(
      ("Type Description", "Builder Method", "Expected Suffix"),
      ("String", (cb: ColumnBuilder, n: String) => cb.addString(n), ":String"),
      ("Double", (cb: ColumnBuilder, n: String) => cb.addDouble(n), ":Double"),
      ("Int", (cb: ColumnBuilder, n: String) => cb.addInt(n), ":Int"),
      ("Long", (cb: ColumnBuilder, n: String) => cb.addLong(n), ":Long"),
      ("Boolean", (cb: ColumnBuilder, n: String) => cb.addBoolean(n), ":Boolean"),
      ("Char", (cb: ColumnBuilder, n: String) => cb.addChar(n), ":Char"),
      ("EpochTimestamp", (cb: ColumnBuilder, n: String) => cb.addEpochTimestamp(n), ":EpochTimestamp"),
      ("ScaledDecimal2", (cb: ColumnBuilder, n: String) => cb.addScaledDecimal2(n), ":ScaledDecimal2"),
      ("ScaledDecimal4", (cb: ColumnBuilder, n: String) => cb.addScaledDecimal4(n), ":ScaledDecimal4"),
      ("ScaledDecimal6", (cb: ColumnBuilder, n: String) => cb.addScaledDecimal6(n), ":ScaledDecimal6"),
      ("ScaledDecimal8", (cb: ColumnBuilder, n: String) => cb.addScaledDecimal8(n), ":ScaledDecimal8")
    )

    Scenario("Adding various data types to the builder") {
      forAll(columnTypes) { (typeDesc, addFunc, expectedSuffix) =>

        Given(s"a new ColumnBuilder and a column named 'testCol'")
        val builder = new ColumnBuilder()
        val columnName = "testCol"

        When(s"the $typeDesc column is added")
        addFunc(builder, columnName)

        Then(s"the builder should contain the formatted string '$columnName$expectedSuffix'")
        // We check the internal 'columns' array to ensure the builder logic is correct
        builder.columns.result() should contain (columnName + expectedSuffix)

        And("building should produce an array of Columns")
        val result = builder.build()
        result should not be null
        result.length shouldBe 1
        result.head.name shouldBe columnName
      }
    }

    Scenario("Chaining multiple column additions") {
      Given("a ColumnBuilder")
      val builder = new ColumnBuilder()

      When("multiple columns are added via chaining")
      val result = builder
        .addString("name")
        .addInt("age")
        .addDouble("salary")
        .build()

      Then("the resulting array should contain three columns")
      result should have size 3
      result.map(_.name) should contain theSameElementsInOrderAs Seq("name", "age", "salary")
    }
  }
}