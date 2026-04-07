package org.finos.vuu.net.json.mixin

import org.finos.vuu.net.rpc.{RpcErrorResult, RpcResult, RpcSuccessResult}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

class RpcResultMixinTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check we can serialize and deserialize UI actions") {

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[RpcResult], classOf[RpcResultMixin])
      .build()

    Scenario("RpcSuccessResult") {

      val action = RpcSuccessResult("y@y")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"SUCCESS_RESULT\",\"data\":\"y@y\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[RpcResult])

      action shouldEqual roundTripAction
    }

    Scenario("RpcErrorResult") {

      val action = RpcErrorResult("N@y")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"ERROR_RESULT\",\"errorMessage\":\"N@y\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[RpcResult])

      action shouldEqual roundTripAction
    }

  }

}
