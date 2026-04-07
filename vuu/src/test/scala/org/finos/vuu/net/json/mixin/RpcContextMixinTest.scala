package org.finos.vuu.net.json.mixin

import org.finos.vuu.net.rpc.{GlobalContext, RpcContext, ViewPortContext, ViewPortRowContext}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

class RpcContextMixinTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check we can serialize and deserialize UI actions") {

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[RpcContext], classOf[RpcContextMixin])
      .build()

    Scenario("GlobalContext") {

      val action = GlobalContext

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"GLOBAL_CONTEXT\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[RpcContext])

      action shouldEqual roundTripAction
    }

    Scenario("ViewPortContext") {

      val action = ViewPortContext("vpId")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"VIEWPORT_CONTEXT\",\"viewPortId\":\"vpId\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[RpcContext])

      action shouldEqual roundTripAction
    }

    Scenario("ViewPortRowContext") {

      val action = ViewPortRowContext("vpId", "rowId")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"VIEWPORT_ROW_CONTEXT\",\"viewPortId\":\"vpId\",\"rowKey\":\"rowId\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[RpcContext])

      action shouldEqual roundTripAction
    }

  }

}
