package org.finos.vuu.example.ignite.schema

import org.finos.vuu.example.ignite.utils.getListToObjectConverter
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class getListToObjectConverterTest extends AnyFeatureSpec with Matchers {

  Feature("getListToObjectConverterTest") {
    Scenario("Can build Dto from a list of values") {
      val dto = getListToObjectConverter[TestDto](TestDto)(List("TestObject", 25.5))

      dto shouldEqual TestDto(name = "TestObject", value = 25.5)
    }
  }

  private case class TestDto(name: String, value: Double)
}