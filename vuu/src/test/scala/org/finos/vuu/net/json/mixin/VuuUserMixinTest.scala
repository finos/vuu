package org.finos.vuu.net.json.mixin

import org.finos.vuu.core.auths.VuuUser
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

import java.time.Instant

class VuuUserMixinTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check we can serialize and deserialize Vuu Users") {

    val mapper = JsonMapper.builder()
      .addModule(DefaultScalaModule())
      .addMixIn(classOf[VuuUser], classOf[VuuUserMixin])
      .build()

    Scenario("VuuUser") {

      val user = VuuUser("mikey", Instant.EPOCH.plusNanos(1), Set("Pies"))

      val jsonString = mapper.writeValueAsString(user)

      jsonString shouldEqual "{\"name\":\"mikey\",\"expiry\":\"1970-01-01T00:00:00.000000001Z\",\"authorizations\":[\"Pies\"]}"

      val roundTripUser = mapper.readValue(jsonString, classOf[VuuUser])

      user shouldEqual roundTripUser
    }

  }

}
