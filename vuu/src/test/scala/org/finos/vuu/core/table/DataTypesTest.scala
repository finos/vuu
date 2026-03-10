package org.finos.vuu.core.table

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks

class DataTypesTest extends AnyFeatureSpec with Matchers with TableDrivenPropertyChecks {

  Feature("Check data type roundtripping") {

    Scenario("Data types should correctly serialize to and from strings") {

      val dataTypes = Table(
        "typeString",
        "string",
        "boolean",
        "long",
        "int",
        "double",
        "char",
        "epochtimestamp",
        "scaleddecimal2",
        "scaleddecimal4",
        "scaleddecimal6",
        "scaleddecimal8"
      )

      forAll(dataTypes) { (typeString) =>
        val dataType = DataType.fromString(typeString)
        val result   = DataType.asString(dataType)

        result should equal(typeString)
      }
    }
  }
}