package org.finos.vuu.net.json.mixin

import org.finos.vuu.net.{LoginRequest, LoginSuccess, MessageBody}
import org.finos.vuu.net.row.RowUpdate
import org.finos.vuu.net.rpc.{GlobalContext, RpcContext}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

class MessageBodyMixinTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check we can serialize and deserialize message bodies") {

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[MessageBody], classOf[MessageBodyMixin])
      .build()

    Scenario("LoginRequest") {

      val action = LoginRequest("token123")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"LOGIN\",\"token\":\"token123\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[MessageBody])

      action shouldEqual roundTripAction
    }

    Scenario("LoginSuccess") {

      val action = LoginSuccess("vs123")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"LOGIN_SUCCESS\",\"vuuServerId\":\"vs123\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[MessageBody])

      action shouldEqual roundTripAction
    }

  }

}
