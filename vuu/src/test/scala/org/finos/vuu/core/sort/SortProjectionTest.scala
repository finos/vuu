package org.finos.vuu.core.sort

import org.finos.vuu.core.sort.SortDirection.{Ascending, Descending}
import org.finos.vuu.core.table.{Column, DataType, SimpleColumn}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks

class SortProjectionTest extends AnyFeatureSpec with Matchers with GivenWhenThen with TableDrivenPropertyChecks {

  Feature("SortProjectionComparator") {

    def createColumn(name: String, dataType: Class[?]): Column = SimpleColumn(name, 0 , dataType)

    Scenario("Verify sorting and null handling for all supported types and directions") {

      val testCases = Table(
        ("Label", "DataType", "Direction", "Val1", "Val2", "Expected (Sign)"),
        //Strings
        ("String Asc: A vs B", DataType.StringDataType, Ascending, "A", "B", -1),
        ("String Asc: B vs A", DataType.StringDataType, Ascending, "B", "A", 1),
        ("String Desc: A vs B", DataType.StringDataType, Descending, "A", "B", 1),
        ("String Desc: B vs A", DataType.StringDataType, Descending, "B", "A", -1),
        //Strings: Null Handling
        ("String Asc: Null vs Val", DataType.StringDataType, Ascending, null, "A", 1),
        ("String Asc: Val vs Null", DataType.StringDataType, Ascending, "A", null, -1),
        ("String Desc: Null vs Val", DataType.StringDataType, Descending, null, "A", -1),
        ("String Desc: Val vs Null", DataType.StringDataType, Descending, "A", null, 1),
        //Comparable
        ("Int Asc: 1 vs 10", DataType.IntegerDataType, Ascending, 1.asInstanceOf[AnyRef], 10.asInstanceOf[AnyRef], -1),
        ("Int Desc: 1 vs 10", DataType.IntegerDataType, Descending, 1.asInstanceOf[AnyRef], 10.asInstanceOf[AnyRef], 1),
        //Comparable: Null Handling
        ("Comparable Asc: Null vs 100", DataType.IntegerDataType, Ascending, null, 100.asInstanceOf[AnyRef], 1),
        ("Comparable Desc: Null vs 100", DataType.IntegerDataType, Descending, null, 100.asInstanceOf[AnyRef], -1)
      )

      forAll(testCases) { (label, dataType, direction, val1, val2, expectedSign) =>
        Given(s"a comparator for $label")
        val column = createColumn("testCol", dataType)
        val comparator = SortProjectionComparator(Array(column), Array(direction))

        When("two rows are compared (offset by 1 for row key)")
        val row1 = Array[AnyRef]("key1", val1)
        val row2 = Array[AnyRef]("key2", val2)
        val result = comparator.compare(row1, row2)

        Then(s"the result should have sign $expectedSign")
        if (expectedSign == 0) result shouldBe 0
        else if (expectedSign > 0) result should be > 0
        else result should be < 0
      }
    }

    Scenario("Multi-column sort: should fall back to second column if first is equal") {
      Given("a multi-column comparator (Col1 Asc, Col2 Desc)")
      val col1 = createColumn("col1", DataType.StringDataType)
      val col2 = createColumn("col2", DataType.IntegerDataType)

      val comparator = SortProjectionComparator(
        Array(col1, col2),
        Array(Ascending, Descending)
      )

      When("comparing rows where Col1 is identical")
      // Projection structure: [Key, Col1, Col2]
      val row1 = Array[AnyRef]("k1", "Apple", 10.asInstanceOf[AnyRef])
      val row2 = Array[AnyRef]("k2", "Apple", 20.asInstanceOf[AnyRef])

      val result = comparator.compare(row1, row2)

      Then("it should sort by Col2 in Descending order (20 > 10, so row2 < row1)")
      result should be > 0 // Row1(10) vs Row2(20) in Desc: 10 is "greater" than 20
    }

    Scenario("Identity check: same object references should return 0") {
      Given("a comparator and a single row")
      val col = createColumn("col", DataType.StringDataType)
      val comparator = SortProjectionComparator(Array(col), Array(Ascending))
      val row = Array[AnyRef]("key", "SomeValue")

      When("comparing a row with itself")
      val result = comparator.compare(row, row)

      Then("the result should be 0 immediately (eq check)")
      result shouldBe 0
    }
  }
}