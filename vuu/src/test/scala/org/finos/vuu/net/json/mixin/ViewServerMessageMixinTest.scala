package org.finos.vuu.net.json.mixin

import org.finos.vuu.net.{JsonViewServerMessage, LoginRequest, MessageBody, ViewServerMessage}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

class ViewServerMessageMixinTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check we can serialize and deserialize view server messages") {

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[MessageBody], classOf[MessageBodyMixin])
      .addMixIn(classOf[ViewServerMessage], classOf[ViewServerMessageMixin])
      .build()

    Scenario("ViewServerMessage") {

      val message = JsonViewServerMessage("REQ:123", "SESS:456", LoginRequest("AAA11122233"))

      val json = mapper.writeValueAsString(message)

      json shouldEqual "{\"requestId\":\"REQ:123\",\"sessionId\":\"SESS:456\",\"body\":{\"type\":\"LOGIN\",\"token\":\"AAA11122233\"},\"module\":\"CORE\"}"

      val roundTrip = mapper.readValue(json, classOf[ViewServerMessage])

      roundTrip should equal(message)
    }

  }

}
