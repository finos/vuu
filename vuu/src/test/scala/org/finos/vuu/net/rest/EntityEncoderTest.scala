package org.finos.vuu.net.rest

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets

// Dummy class for JSON testing
case class UserData(id: Int, name: String)

class EntityEncoderTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("StringEncoder") {
    Scenario("Encoding and decoding strings") {
      Given("a StringEncoder and a test string")
      val encoder = StringEncoder
      val message = "Hello Vuu"

      When("the string is encoded to bytes")
      val encoded = encoder.encode(message)

      And("the bytes are decoded back via an InputStream")
      val decoded = encoder.decode(new ByteArrayInputStream(encoded))

      Then("the result should match the original string")
      decoded shouldBe message
      encoder.contentType shouldBe "text/plain"
    }

    Scenario("Handling null values") {
      Given("a StringEncoder")
      When("encoding a null string")
      val encoded = StringEncoder.encode(null)

      Then("it should return an empty byte array")
      encoded shouldBe Array.emptyByteArray
    }
  }

  Feature("EmptyEncoder") {
    Scenario("Behavior of the EmptyEncoder") {
      Given("an EmptyEncoder")
      val encoder = EmptyEncoder

      Then("encode should return an empty array")
      encoder.encode(null) shouldBe Array.emptyByteArray

      And("decode should return null")
      encoder.decode(new ByteArrayInputStream(Array.empty)) shouldBe null

      And("contentType should be text/plain")
      encoder.contentType shouldBe "text/plain"
    }
  }

  Feature("JsonEntityEncoder") {

    val encoder = JsonEntityEncoder[UserData]()

    Scenario("Encoding and decoding a case class") {
      Given("a JsonEntityEncoder for UserData")
      val user = UserData(1, "John Doe")

      When("the object is encoded")
      val bytes = encoder.encode(user)

      Then("it should look like valid JSON")
      new String(bytes, StandardCharsets.UTF_8) shouldEqual "{\"id\":1,\"name\":\"John Doe\"}"

      And("when decoded back")
      val decoded = encoder.decode(new ByteArrayInputStream(bytes))

      Then("it should equal the original object")
      decoded shouldBe user
      encoder.contentType shouldBe "application/json"
    }

  }
}