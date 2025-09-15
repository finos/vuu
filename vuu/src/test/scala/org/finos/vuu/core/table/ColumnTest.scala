package org.finos.vuu.core.table

import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}
import org.finos.vuu.api.{ColumnBuilder, TableDef}
import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}
import org.finos.vuu.util.types.TypeUtils
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

class ColumnTest extends AnyFeatureSpec with Matchers {

  Feature("DataType.parseToDataType") {
    forAll(Table(
      ("data-type", "string-input", "expected-output"),
      (DataType.BooleanDataType, "false", false),
      (DataType.CharDataType, "8", '8'),
      (DataType.StringDataType, "name", "name"),
      (DataType.IntegerDataType, "27", 27),
      (DataType.LongDataType, "33", 33L),
      (DataType.DoubleDataType, "33.55", 33.55),
      (DataType.EpochTimestampType, "100000000", EpochTimestamp.apply(100000000)),
      (DataType.DecimalType, "200000000", Decimal.apply(200000000)),
    ))((dataType, stringInput, expectedOutput) => {
      Scenario(s"can parse string '$stringInput' to `$dataType` type") {
        val parsedValue = DataType.parseToDataType(stringInput, dataType)

        parsedValue shouldEqual Some(expectedOutput)
        TypeUtils.areTypesEqual(dataType, parsedValue.get.getClass) shouldBe true
      }
    })

    forAll(Table(
      ("data-type", "string-input"),
      (DataType.BooleanDataType, "falseX"),
      (DataType.IntegerDataType, "27.5"),
      (DataType.LongDataType, "33.5"),
      (DataType.DoubleDataType, "12x1"),
      (DataType.EpochTimestampType, "44.5"),
      (DataType.DecimalType, "46.5"),
    ))((dataType, stringInput) => {
      Scenario(s"should return empty when string '$stringInput' cannot be parsed to `$dataType` type") {
        val parsedValue = DataType.parseToDataType(stringInput, dataType)

        parsedValue shouldBe empty
      }
    })

  }

  Feature("Columns.allFromExceptDefaultColumns") {
    Scenario("Create join columns for all columns in table def except default columns") {
      val tableDef = TableDef(
        name = "TestTable",
        keyField = "Id",
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .addEpochTimestamp("ExecutionTimestamp")
            .addDecimal("Price")
            .build()
      )

      val joinColumns = Columns.allFrom(tableDef)
      joinColumns.length shouldEqual 5
      joinColumns.map(_.name) should contain theSameElementsAs Array("Id", "Name", "Account", "Price", "ExecutionTimestamp")
    }
  }

  Feature("Columns.allFromExcept") {
    Scenario("Create join columns for all columns in table def except given columns and default columns") {
      val tableDef = TableDef(
        name = "TestTable",
        keyField = "Id",
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build()
      )

      val joinColumns = Columns.allFromExcept(tableDef, "Name")
      joinColumns.length shouldEqual 2
      joinColumns.map(_.name) should contain theSameElementsAs Array("Id", "Account")
    }
  }
}
