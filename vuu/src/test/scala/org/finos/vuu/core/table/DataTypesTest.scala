package org.finos.vuu.core.table

import org.scalatest.OneInstancePerTest
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DataTypesTest extends AnyFeatureSpec with Matchers with OneInstancePerTest {

  Feature("Check data type roundtripping") {

    Scenario("data types") {

      val inputs = List("string", "boolean", "long", "int", "double", "char", "epochtimestamp")

      val classes = inputs.map(DataType.fromString)

      val output = classes.map(DataType.asString)

      inputs should equal(output)
    }
  }
}
