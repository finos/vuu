package org.finos.vuu.net

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class WebSocketApiTest extends AnyFeatureSpec with Matchers {

  def awaitMsg[TYPE](implicit client: ViewServerClient): Option[TYPE] = {
    None
  }

  Feature("test server api shape"){

    Scenario("test login and creation of view port"){

//      implicit val serverApi: ServerApi = null
//      implicit val client: Client = null
//
//      client.send(serverApi.serialize(AuthenticateMessage("foo", "bar")))
//
//      val responseOption = awaitMsg[LoginResponse]
//
//      val response = responseOption.get
//
//      val vpId = UUID.randomUUID().toString
//
//      client.send(serverApi.serialize(CreateViewPort(response.token, vpId, "orderPrices")))
//
//      val vpResonse = awaitMsg[ServerMessage]

    }

  }

}
