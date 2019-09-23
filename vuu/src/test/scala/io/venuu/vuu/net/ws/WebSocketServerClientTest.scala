package io.venuu.vuu.net.ws

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{DefaultTimeProvider, TimeProvider}
import io.venuu.vuu.core.CoreServerApiHander
import io.venuu.vuu.core.module.ModuleContainer
import io.venuu.vuu.core.table.TableContainer
import io.venuu.vuu.net.auth.AlwaysHappyAuthenticator
import io.venuu.vuu.net._
import io.venuu.vuu.provider.{JoinTableProviderImpl, ProviderContainer}
import io.venuu.vuu.viewport.ViewPortContainer
import org.scalatest._

/**
 * Created by chris on 25/10/2015.
 */
class WebSocketServerClientTest extends FeatureSpec with Matchers {

  import io.venuu.vuu.client.ClientHelperFns._

  feature("Check that we can create a websocket server and client"){

    ignore("create web socket server and client and send data between"){

      implicit val lifecycle = new LifecycleContainer
      implicit val timeProvider: TimeProvider = new DefaultTimeProvider
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val serializer = JsonVsSerializer
      val authenticator = new AlwaysHappyAuthenticator
      val tokenValidator = new AlwaysHappyLoginValidator

      val sessionContainer = new ClientSessionContainerImpl()

      val joinProvider = new JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val viewPortContainer = new ViewPortContainer(tableContainer)

      val providerContainer = new ProviderContainer(joinProvider)

      val serverApi = new CoreServerApiHander(viewPortContainer, tableContainer, providerContainer)

      val moduleContainer = new ModuleContainer


      //val processor = new RequestProcessor(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer)

      //val handler = new ViewServerHandler(serializer, processor)

      val factory = new ViewServerHandlerFactoryImpl(authenticator, tokenValidator, sessionContainer, serverApi, JsonVsSerializer, moduleContainer)

      //order of creation here is important
      val server = new WebSocketServer(8090, factory)
      val client = new WebSocketClient("ws://localhost:8090/websocket", 8090)
      implicit val vsClient = new WebSocketViewServerClient(client, JsonVsSerializer)

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
