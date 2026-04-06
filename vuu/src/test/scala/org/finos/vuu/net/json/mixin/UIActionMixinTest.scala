package org.finos.vuu.net.json.mixin

import org.finos.vuu.net.{NoneAction, NotificationType, ShowNotificationAction, UIAction}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

class UIActionMixinTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check we can serialize and deserialize UI actions") {

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[UIAction], classOf[UIActionMixin])
      .build()

    Scenario("NoneAction") {

      val action = NoneAction

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual "{\"type\":\"NO_ACTION\"}"

      val roundTripAction = mapper.readValue(jsonString, classOf[UIAction])

      action shouldEqual roundTripAction
    }

    Scenario("ShowNotificationAction") {

      val action = ShowNotificationAction(NotificationType.Error, "Error Title", "Oopsie")

      val jsonString = mapper.writeValueAsString(action)

      jsonString shouldEqual """{"type":"SHOW_NOTIFICATION_ACTION","notificationType":"Error","title":"Error Title","message":"Oopsie"}"""

      val roundTripAction = mapper.readValue(jsonString, classOf[UIAction])

      action shouldEqual roundTripAction
    }

  }

}
