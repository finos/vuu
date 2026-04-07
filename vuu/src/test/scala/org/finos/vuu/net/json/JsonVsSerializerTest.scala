package org.finos.vuu.net.json

import org.finos.vuu.net.{JsonViewServerMessage, LoginRequest}
import org.finos.vuu.net.json.VsJsonSerializer
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class JsonVsSerializerTest extends AnyFeatureSpec with Matchers {

  Feature("Check we can serialize and deserialize view server messages"){

    val serializer = VsJsonSerializer()

    Scenario("Default module"){

      val message = JsonViewServerMessage("REQ:123", "SESS:456", LoginRequest("AAA11122233"))

      val json = serializer.serialize(message)

      json shouldEqual "{\"requestId\":\"REQ:123\",\"sessionId\":\"SESS:456\",\"body\":{\"type\":\"LOGIN\",\"token\":\"AAA11122233\"},\"module\":\"CORE\"}"

      val roundTrip = serializer.deserialize(json)

      roundTrip should equal(message)
    }

    Scenario("Specific module") {

      val message = JsonViewServerMessage("REQ:123", "SESS:456", LoginRequest("AAA11122233"), "MIKEY")

      val json = serializer.serialize(message)

      json shouldEqual "{\"requestId\":\"REQ:123\",\"sessionId\":\"SESS:456\",\"body\":{\"type\":\"LOGIN\",\"token\":\"AAA11122233\"},\"module\":\"MIKEY\"}"

      val roundTrip = serializer.deserialize(json)

      roundTrip should equal(message)
    }

  }

}
