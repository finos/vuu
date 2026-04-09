package org.finos.vuu.net.json

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks

class JsonMapperFactoryTest extends AnyFeatureSpec with Matchers with TableDrivenPropertyChecks {

  private val jsonMapper = JsonMapperFactory.build

  Feature("toRawJson") {
    Scenario("can convert an instance of a case class to json string") {
      val dto = TestDto(name = "orange", value = 13.7, quantity = Some(5))

      val result = jsonMapper.writeValueAsString(dto)

      result shouldEqual """{"name":"orange","value":13.7,"quantity":5}"""
    }
  }

  Feature("toPrettyJson") {
    Scenario("can convert an instance of a case class to pretty json string") {
      val dto = TestDto(name = "orange", value = 13.7, quantity = Some(5))

      val result = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(dto)

      val n = System.lineSeparator()
      result shouldEqual s"{$n  \"name\" : \"orange\",$n  \"value\" : 13.7,$n  \"quantity\" : 5$n}"
    }
  }

  Feature("fromJson") {
    forAll(Table(
      ("scenario", "json-as-string"),
      ("json with double-quotes", """{"name": "apple", "value": 20.5, "quantity": 7}"""),
      ("json with single-quotes", """{'name': 'apple', 'value': 20.5, 'quantity': 7}"""),
      ("json with unquoted field names", """{name: "apple", value: 20.5, quantity: 7}"""),
      ("json with mixed single & double quotes", """{'name': "apple", "value": 20.5, 'quantity': 7}"""),
      ("json with quoted and non-quoted field names", """{name: 'apple', "value": 20.5, 'quantity': 7}"""),
    ))((scenario, jsonAsString) => {
      Scenario(s"can create an instance of a case class from `$scenario`") {
        val result = jsonMapper.readValue[TestDto](jsonAsString)
        result shouldEqual TestDto(name = "apple", value = 20.5, quantity = Some(7))
      }
    })

    Scenario("can generate an array of DTOs from a json array") {
      val jsonArray ="""[
                       |{"name": "apple", "value": 20.5, "quantity": 15},
                       |{"name": "orange", "value": 0.45, "quantity": 7}
                       |]""".stripMargin

      val result = jsonMapper.readValue[List[TestDto]](jsonArray)

      result shouldEqual List(
        TestDto(name = "apple", value = 20.5, quantity = Some(15)),
        TestDto(name = "orange", value = 0.45, quantity = Some(7))
      )
    }

    Scenario("falls back to `None` when an `Option` field is missing") {
      val jsonAsString = """{"name": "orange", "value": 20.5}"""

      val result = jsonMapper.readValue[TestDto](jsonAsString)

      result shouldEqual TestDto(name = "orange", value = 20.5, quantity = None)
    }

    Scenario("falls back to `None` when an `Option` field is null") {
      val jsonAsString = """{"name": "orange", "value": 20.5, "quantity": null}"""

      val result = jsonMapper.readValue[TestDto](jsonAsString)

      result shouldEqual TestDto(name = "orange", value = 20.5, quantity = None)
    }
  }
}

private case class TestDto(name: String = null, value: Double, quantity: Option[Int])
