package org.finos.vuu.util.types

import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}
import org.finos.vuu.util.types.DefaultTypeConverters._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

class DefaultTypeConvertersTest extends AnyFeatureSpec with Matchers {

  Feature("Handle converting valid value to the given type") {

    forAll(Table(
      ("title", "converter", "input", "expected output"),
      ("String to Double", stringToDoubleConverter, "10.5", 10.5),
      ("String to Long", stringToLongConverter, "10000", 10_000L),
      ("String to Int", stringToIntConverter, "10", 10),
      ("String to Boolean", stringToBooleanConverter, "false", false),
      ("String to Char", stringToCharConverter, "A", 'A'),
      ("String to EpochTimestamp", stringToEpochTimestampConverter, "20000", EpochTimestamp(20_000)),
      ("String to Decimal", stringToDecimalConverter, "30000", Decimal(30_000)),
      ("Int to String", intToStringConverter, 10, "10"),
      ("Int to Long", intToLongConverter, 10, 10L),
      ("Int to Double", intToDoubleConverter, 10, 10.0),
      ("Long to String", longToStringConverter, 10_000L, "10000"),
      ("Long to Int", longToIntConverter, 10_000L, 10_000),
      ("Long to Double", longToDoubleConverter, 10_000L, 10000.0),
      ("Double to String", doubleToStringConverter, 10.5, "10.5"),
      ("Double to Int", doubleToIntConverter, 10.5, 10),
      ("Double to Long", doubleToLongConverter, 10.5, 10L),
      ("Boolean to String", booleanToStringConverter, true, "true"),
      ("Char to String", charToStringConverter, 'Z', "Z"),
      ("EpochTimestamp to String", epochTimestampToStringConverter, EpochTimestamp(20_000), "20000"),
      ("Decimal to String", decimalToStringConverter, Decimal(30_000), "30000"),
    ))((title, converter, input, expectedOutput) => {
      Scenario(title) {
        val result = converter.asInstanceOf[TypeConverter[Any, Any]].convert(input)

        result shouldEqual expectedOutput
        converter.toClass.isInstance(result) shouldBe true
      }
    })
  }

  Feature("Handle null inputs") {
    forAll(Table(
      ("title", "converter"),
      ("String to Double", stringToDoubleConverter),
      ("String to Long", stringToLongConverter),
      ("String to Int", stringToIntConverter),
      ("String to Boolean", stringToBooleanConverter),
      ("String to Char", stringToCharConverter),
      ("Int to String", intToStringConverter),
      ("Int to Long", intToLongConverter),
      ("Int to Double", intToDoubleConverter),
      ("Long to String", longToStringConverter),
      ("Long to Int", longToIntConverter),
      ("Long to Double", longToDoubleConverter),
      ("Double to String", doubleToStringConverter),
      ("Double to Int", doubleToIntConverter),
      ("Double to Long", doubleToLongConverter),
      ("Boolean to String", booleanToStringConverter),
      ("Char to String", charToStringConverter),
    ))((title, converter) => {
      Scenario(title) {
        converter.convert(null) shouldEqual null
      }
    })
  }

}
