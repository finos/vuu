package org.finos.vuu.net.json.mixin

import org.finos.vuu.viewport.{CloseDialogViewPortAction, NoAction, OpenDialogViewPortAction, ViewPortAction, ViewPortCreateSuccess, ViewPortRpcFailure, ViewPortRpcSuccess, ViewPortTable}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

class ViewPortActionMixinTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check we can serialize and deserialize viewport actions") {

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[ViewPortAction], classOf[ViewPortActionMixin])
      .build()

    Scenario("NoAction") {
      
      val action = NoAction

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"NO_ACTION\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[ViewPortAction])

      action shouldEqual roundTripAction
    }

    Scenario("OpenDialogViewPortAction") {

      val action = OpenDialogViewPortAction(ViewPortTable("lol", "cats"))

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"OPEN_DIALOG_ACTION\",\"table\":{\"table\":\"lol\",\"module\":\"cats\"},\"renderComponent\":\"grid\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[ViewPortAction])

      action shouldEqual roundTripAction
    }

    Scenario("CloseDialogViewPortAction") {

      val action = CloseDialogViewPortAction("vpId")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"CLOSE_DIALOG_ACTION\",\"vpId\":\"vpId\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[ViewPortAction])

      action shouldEqual roundTripAction
    }

    Scenario("ViewPortRpcSuccess") {

      val action = ViewPortRpcSuccess

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"VP_RPC_SUCCESS\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[ViewPortAction])

      action shouldEqual roundTripAction
    }

    Scenario("ViewPortRpcFailure") {

      val action = ViewPortRpcFailure("dog")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"VP_RPC_FAILURE\",\"msg\":\"dog\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[ViewPortAction])

      action shouldEqual roundTripAction
    }

    Scenario("ViewPortCreateSuccess") {

      val action = ViewPortCreateSuccess("muffins")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"VP_CREATE_SUCCESS\",\"key\":\"muffins\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[ViewPortAction])

      action shouldEqual roundTripAction
    }

  }

}
