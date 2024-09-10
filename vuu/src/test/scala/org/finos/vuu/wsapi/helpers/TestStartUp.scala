package org.finos.vuu.wsapi.helpers

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.core._
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.net.{AlwaysHappyLoginValidator, ViewServerClient, WebSocketViewServerClient}

class TestStartUp(moduleFactoryFunc: () => ViewServerModule)(
                  implicit val timeProvider: Clock,
                  implicit val lifecycle: LifecycleContainer,
                  implicit val tableDefContainer: TableDefContainer){


  def startServerAndClient(): TestVuuClient = {

    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    lifecycle.autoShutdownHook()

    val rand = new scala.util.Random
    val http = rand.between(10011, 10500)
    val ws = rand.between(10011, 10500)

    val module: ViewServerModule = moduleFactoryFunc()

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
        .withLoginValidator(new AlwaysHappyLoginValidator),
      VuuThreadingOptions(),
      VuuClientConnectionOptions()
        .withHeartbeatDisabled()
    )
      .withModule(module)

    val viewServer = new VuuServer(config)

    val client = new WebSocketClient(s"ws://localhost:$ws/websocket", ws) //todo review params - port specified twice
    val viewServerClient: ViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer)
    val vuuClient = new TestVuuClient(viewServerClient)

    //set up a dependency on ws server from ws client.
    lifecycle(client).dependsOn(viewServer)

    //lifecycle registration is done in constructor of service classes, so sequence of create is important
    lifecycle.start()

    vuuClient
  }
}
