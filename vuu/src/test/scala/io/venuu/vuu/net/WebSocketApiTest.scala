package io.venuu.vuu.net

import org.scalatest._

/**
 * Created by chris on 26/10/2015.
 */
class WebSocketApiTest extends FeatureSpec with Matchers {

  def awaitMsg[TYPE](implicit client: ViewServerClient): Option[TYPE] = {
    None
  }

  feature("test server api shape"){

    scenario("test login and creation of view port"){

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
