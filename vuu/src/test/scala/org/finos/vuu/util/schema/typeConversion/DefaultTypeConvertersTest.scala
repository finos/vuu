package org.finos.vuu.util.schema.typeConversion

import org.finos.vuu.util.schema.typeConversion.DefaultTypeConverters._
import org.scalatest.prop.TableDrivenPropertyChecks._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DefaultTypeConvertersTest extends AnyFeatureSpec with Matchers {

  Feature("Handle converting valid value to the given type") {

    forAll(Table(
      ("title", "converter", "input", "expected output"),
      ("String to Double", stringToDoubleConverter, "10.5", 10.5),
      ("Double to String", doubleToStringConverter, 10.5, "10.5"),
      ("String to Long", stringToLongConverter, "10000", 10_000L),
      ("Long to String", longToStringConverter, 10_000L, "10000"),
      ("Int to String", intToStringConverter, 10, "10"),
      ("String to Int", stringToIntConverter, "10", 10),
    ))((title, converter, input, expectedOutput) => {
      Scenario(title) {
        converter.asInstanceOf[TypeConverter[Any, Any]].convert(input) shouldEqual expectedOutput
      }
    })
  }

  Feature("Handle null inputs") {
    forAll(Table(
      ("title", "converter"),
      ("String to Double", stringToDoubleConverter),
      ("Double to String", doubleToStringConverter),
      ("String to Long", stringToLongConverter),
      ("Long to String", longToStringConverter),
      ("Int to String", intToStringConverter),
      ("String to Int", stringToIntConverter),
    ))((title, converter) => {
      Scenario(title) {
        converter.convert(null) shouldEqual null
      }
    })
  }

}
