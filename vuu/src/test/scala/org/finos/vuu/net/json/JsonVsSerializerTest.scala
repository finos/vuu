package org.finos.vuu.net.json

import org.finos.vuu.net.*
import org.finos.vuu.net.json.VsJsonSerializer
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class JsonVsSerializerTest extends AnyFeatureSpec with Matchers {

  Feature("test serialization of view server messages "){

    Scenario("test login request"){

      roundTrip(LoginRequest("AAA11122233"))

    }

  }

  def roundTrip(body: MessageBody): Unit = {

    val message = JsonViewServerMessage("REQ:123", "SESS:456", body)

    val serializer = VsJsonSerializer()

    val json = serializer.serialize(message)

    println("To Json = " + json)

    val o = serializer.deserialize(json)

    o should equal(message)

    println("from Json = " + o)
  }

}

//roundTrip(LoginSuccess("vuuServerId"))
//      roundTrip(HeartBeat(123L))
//      roundTrip(HeartBeatResponse(123L))
//      roundTrip(RpcUpdate(ViewPortTable("orderEntry", "CORE"), "Foo", Map("Foo" -> 123, "Bar" -> true, "Whizzle" -> "TANG", "HooHa" -> 344567L)))
//      roundTrip(RpcSuccess(ViewPortTable("orderEntry", "CORE"), "Foo"))
//      roundTrip(RpcReject(ViewPortTable("orderEntry", "CORE"), "Foo", "cause you aint pretty"))
//      roundTrip(OpenTreeNodeSuccess("orderEntry", "..."))