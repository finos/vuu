package org.finos.vuu.net.ws

import org.finos.vuu.client.ClientHelperFns.awaitMsgBody
import org.finos.vuu.core.{CoreServerApiHandler, VuuWebSocketOptions, VuuWebSocketOptionsImpl}
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net._
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.provider.{JoinTableProviderImpl, ProviderContainer}
import org.finos.vuu.viewport.ViewPortContainer
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class WebSocketServerClientTest extends AnyFeatureSpec with Matchers {

  Feature("Check that we can create a websocket server and client"){

    ignore("create web socket server and client and send data between"){

      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val serializer = JsonVsSerializer
      val authenticator = new AlwaysHappyAuthenticator
      val tokenValidator = new AlwaysHappyLoginValidator

      val sessionContainer = new ClientSessionContainerImpl()

      val joinProvider = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val providerContainer = new ProviderContainer(joinProvider)

      val pluginRegistry = new DefaultPluginRegistry
      pluginRegistry.registerPlugin(new VuuInMemPlugin)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      val serverApi = new CoreServerApiHandler(viewPortContainer, tableContainer, providerContainer)

      val moduleContainer = new ModuleContainer
      
      val factory = new ViewServerHandlerFactoryImpl(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer, moduleContainer)

      val options = VuuWebSocketOptions.apply()
        .withWsPort(18090)
        .withBindAddress("0.0.0.0")
        //.withWss()

      //order of creation here is important
      val server = new WebSocketServer(options, factory)

      val client = new WebSocketClient("ws://localhost:8090/websocket", 18090)
      implicit val vsClient = new WebSocketViewServerClient(client, JsonVsSerializer)

      //set up a dependency on ws server from ws client.
      lifecycle(client).dependsOn(server)

      //lifecycle registration is done in constructor of service classes, so sequence of create is important
      lifecycle.start()

      vsClient.send(JsonViewServerMessage("", "", "", "",AuthenticateRequest("chris", "chris")))

      val authMsg = awaitMsgBody[AuthenticateSuccess].get

      authMsg.getClass should equal(classOf[AuthenticateSuccess])
      authMsg.token should not be ("")

      vsClient.send(JsonViewServerMessage("", "", authMsg.token, "chris", LoginRequest(authMsg.token, "chris")))

      awaitMsgBody[LoginSuccess].get.token should equal(authMsg.token)
    }

  }

}
