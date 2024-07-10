package org.finos.vuu.net.ws

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.ClientHelperFns.awaitMsgBody
import org.finos.vuu.core.{VuuSecurityOptions, VuuServer, VuuServerConfig, VuuWebSocketOptions}
import org.finos.vuu.net._
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class WebSocketServerClientTest extends AnyFeatureSpec with Matchers {

  Feature("Check that we can create a websocket server and client"){

    Scenario("create connection without ssl between web socket server and client and send data between"){

      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      lifecycle.autoShutdownHook()

      val http = 10021
      val ws = 10023

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withWebRoot("vuu/src/main/resources/www")
          .withSslDisabled()
          .withDirectoryListings(true)
          .withPort(http),
        VuuWebSocketOptions()
          .withBindAddress("0.0.0.0")
          .withUri("websocket")
          .withWsPort(ws)
          .withWssDisabled(),
        VuuSecurityOptions()
          .withAuthenticator(new AlwaysHappyAuthenticator)
          .withLoginValidator(new AlwaysHappyLoginValidator)
      )

      val viewServer = new VuuServer(config)

      val client = new WebSocketClient(s"ws://localhost:$ws/websocket", ws) //todo review params - port specified twice
      implicit val vsClient: ViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer)

      //set up a dependency on ws server from ws client.
      lifecycle(client).dependsOn(viewServer)

      //lifecycle registration is done in constructor of service classes, so sequence of create is important
      lifecycle.start()

      vsClient.send(JsonViewServerMessage("", "", "", "", AuthenticateRequest("chris", "chris")))

      val authMsg = awaitMsgBody[AuthenticateSuccess].get

      authMsg.getClass should equal(classOf[AuthenticateSuccess])
      authMsg.token should not be ""

      vsClient.send(JsonViewServerMessage("", "", authMsg.token, "chris", LoginRequest(authMsg.token, "chris")))

      awaitMsgBody[LoginSuccess].get.token should equal(authMsg.token)

      lifecycle.stop()
    }

  }

}
