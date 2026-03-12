package org.finos.vuu.core.sort

import org.finos.vuu.core.table.{Column, DataType, RowData, RowWithData, SimpleColumn}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks

class RowDataComparatorTest extends AnyFeatureSpec with Matchers with GivenWhenThen with TableDrivenPropertyChecks {

//  Feature("RowDataComparator - Exhaustive DataType Support") {
//
//    Scenario("Comparing all supported data types in Ascending order") {
//
//      val typeScenarios = Table(
//        ("Description", "DataType", "LowerValue", "HigherValue"),
//        ("Strings (Case-Insensitive)", DataType.StringDataType, "apple", "BANANA"),
//        ("Integers", DataType.IntegerDataType, 1, 100),
//        ("Longs", DataType.LongDataType, 100L, 200L),
//        ("Doubles", DataType.DoubleDataType, 1.1, 1.2),
//        ("Booleans", DataType.BooleanDataType, false, true),
//        ("Chars", DataType.CharDataType, 'A', 'Z'),
//        ("Epoch Timestamps", DataType.EpochTimestampType, 1672531200000L, 1672531201000L),
//        ("Scaled Decimal 2", DataType.ScaledDecimal2Type, BigDecimal("10.00"), BigDecimal("20.00")),
//        ("Scaled Decimal 4", DataType.ScaledDecimal4Type, BigDecimal("1.0001"), BigDecimal("1.0002")),
//        ("Scaled Decimal 6", DataType.ScaledDecimal6Type, BigDecimal("0.000001"), BigDecimal("0.000002")),
//        ("Scaled Decimal 8", DataType.ScaledDecimal8Type, BigDecimal("0.00000001"), BigDecimal("0.00000002"))
//      )
//
//      forAll(typeScenarios) { (desc, dType, low, high) =>
//        Given(s"a comparator for $desc ($dType)")
//        val col = SimpleColumn("testCol", 0, dType)
//        val comparator = RowDataComparator(List(col), List(SortDirection.Ascending))
//
//        val rowLow = RowWithData("1", Map(col.name -> low))
//        val rowHigh = RowWithData("2", Map(col.name -> high))
//
//        When(s"comparing $low and $high")
//        val result = comparator.compare(rowLow, rowHigh)
//        val resultReverse = comparator.compare(rowHigh, rowLow)
//        val resultSame = comparator.compare(rowLow, rowLow)
//
//        Then("the comparison results should be mathematically consistent")
//        result should be < 0
//        resultReverse should be > 0
//        resultSame shouldBe 0
//      }
//    }
//
//    Scenario("Handling Unsupported or Unknown DataTypes") {
//      Given("a column with an unsupported data type")
//      val unknownType = DataType.NoDataType
//      val col = SimpleColumn("unknownCol", 0, unknownType)
//      val comparator = RowDataComparator(List(col), List(SortDirection.Ascending))
//
//      val row1 = RowWithData("1", Map(col.name -> "SomeValue"))
//      val row2 = RowWithData("2", Map(col.name -> "OtherValue"))
//
//      When("comparing rows with unsupported types")
//      val result = comparator.compare(row1, row2)
//
//      Then("it should return 0 (default/no-op sort) and log a warning")
//      result shouldBe 0
//    }
//
//    Scenario("Complex multi-type row comparison") {
//      val colStr = SimpleColumn("Symbol", 0, DataType.StringDataType)
//      val colPrice = SimpleColumn("Price", 1, DataType.DoubleDataType)
//      val colActive = SimpleColumn("Active", 2, DataType.BooleanDataType)
//
//      Given("a comparator for (Symbol ASC, Price DESC, Active ASC)")
//      val comparator = RowDataComparator(
//        List(colStr, colPrice, colActive),
//        List(SortDirection.Ascending, SortDirection.Descending, SortDirection.Ascending)
//      )
//
//      val row1 = RowWithData("1", Map(colStr.name -> "VOD", colPrice.name -> 100.0, colActive.name -> true))
//      val row2 = RowWithData("2", Map(colStr.name -> "VOD", colPrice.name -> 100.0, colActive.name -> false)) // Price tie, Active differs
//      val row3 = RowWithData("3", Map(colStr.name -> "VOD", colPrice.name -> 150.0, colActive.name -> true))  // Same symbol, higher price (comes first in DESC)
//
//      When("comparing rows with ties on multiple levels")
//
//      Then("row3 should be 'less than' (before) row1 because of Price DESC")
//      comparator.compare(row3, row1) should be < 0
//
//      And("row1 should be 'greater than' (after) row2 because of Active ASC (true > false)")
//      comparator.compare(row1, row2) should be > 0
//    }
//  }
}
