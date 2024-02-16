package org.finos.toolbox.json

import org.finos.toolbox.json.JsonUtil.{fromJson, toRawJson}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class JsonUtilTest extends AnyFeatureSpec with Matchers {

  Feature("toRawJson") {
    Scenario("can convert an instance of a case class to json string") {
      val dto = TestDto(name = "orange", value = 13.7, quantity = Some(5))

      val result = toRawJson(dto)

      result shouldEqual """{"name":"orange","value":13.7,"quantity":5}"""
    }
  }

  Feature("fromJson") {
    Scenario("can create an instance of a case class from json string") {
      val jsonAsString = """{"name": "apple", "value": 20.5, "quantity": 7}"""

      val result = fromJson[TestDto](jsonAsString)

      result shouldEqual TestDto(name = "apple", value = 20.5, quantity = Some(7))
    }

    Scenario("falls back to `None` when an `Option` field is missing") {
      val jsonAsString = """{"name": "orange", "value": 20.5}"""

      val result = fromJson[TestDto](jsonAsString)

      result shouldEqual TestDto(name = "orange", value = 20.5, quantity = None)
    }

    Scenario("falls back to `None` when an `Option` field is null") {
      val jsonAsString = """{"name": "orange", "value": 20.5, "quantity": null}"""

      val result = fromJson[TestDto](jsonAsString)

      result shouldEqual TestDto(name = "orange", value = 20.5, quantity = None)
    }
  }
}

private case class TestDto(name: String = null, value: Double, quantity: Option[Int])