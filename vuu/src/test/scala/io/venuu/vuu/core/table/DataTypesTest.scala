/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 19/01/2016.

  */
package io.venuu.vuu.core.table

import org.scalatest.{FeatureSpec, Matchers, OneInstancePerTest}

class DataTypesTest extends FeatureSpec with Matchers with OneInstancePerTest {

  feature("Check data type roundtripping") {

    scenario("data types") {

      val inputs = List("string", "boolean", "long", "int", "double")

      val classes = inputs.map( DataType.fromString(_))

      val output = classes.map( DataType.asString(_))

      inputs should equal(output)
    }
  }
}
