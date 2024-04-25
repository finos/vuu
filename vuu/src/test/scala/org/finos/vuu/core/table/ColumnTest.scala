package org.finos.vuu.core.table

import org.finos.vuu.util.schema.typeConversion.TypeUtils
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
    ))((dataType, stringInput, expectedOutput) => {
      Scenario(s"can parse string '$stringInput' to `$dataType` type") {
        val parsedValue = DataType.parseToDataType(stringInput, dataType)

        parsedValue shouldEqual Right(expectedOutput)
        TypeUtils.areTypesEqual(dataType, parsedValue.toOption.get.getClass) shouldBe true
      }
    })

    forAll(Table(
      ("data-type", "string-input"),
      (DataType.BooleanDataType, "falseX"),
      (DataType.IntegerDataType, "27.5"),
      (DataType.LongDataType, "33.5"),
      (DataType.DoubleDataType, "12x1"),
    ))((dataType, stringInput) => {
      Scenario(s"should return error when string '$stringInput' cannot be parsed to `$dataType` type") {
        val parsedValue = DataType.parseToDataType(stringInput, dataType)

        parsedValue.isLeft shouldBe true
        parsedValue.swap.toOption.get should startWith("Failed to parse")
      }
    })

  }

}
