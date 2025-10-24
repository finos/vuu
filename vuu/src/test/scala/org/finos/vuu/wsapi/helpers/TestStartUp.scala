package org.finos.vuu.wsapi.helpers

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.*
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.http.{VuuHttp2ServerOptions, WebRootDisabled}
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.net.{ViewServerClient, WebSocketViewServerClient}

import java.security.SecureRandom

class TestStartUp(moduleFactoryFunc: () => ViewServerModule)(
                  using val timeProvider: Clock,
                  val lifecycle: LifecycleContainer,
                  val tableDefContainer: TableDefContainer){

  def startServerAndClient(): TestVuuClient = {

    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    lifecycle.autoShutdownHook()

    val minValue = 10011
    val rand = new SecureRandom()
    val http = rand.nextInt(500) + minValue
    val ws = rand.nextInt(500) + minValue

    val module: ViewServerModule = moduleFactoryFunc()

    val config = VuuServerConfig(
      VuuHttp2ServerOptions()
        .withWebRoot(WebRootDisabled())
        .withSslDisabled()
        .withPort(http),
      VuuWebSocketOptions()
        .withBindAddress("0.0.0.0")
        .withUri("websocket")
        .withWsPort(ws)
        .withSslDisabled(),
      VuuSecurityOptions()
        .withLoginTokenService(LoginTokenService.apply(VuuUser("Test"))),
      VuuThreadingOptions(),
      VuuClientConnectionOptions()
        .withHeartbeatDisabled()
    )
      .withModule(module)

    val viewServer = new VuuServer(config)

    val client = new WebSocketClient(s"ws://localhost:$ws/websocket", ws) //todo review params - port specified twice
    val viewServerClient: ViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer())
    val vuuClient = new TestVuuClient(viewServerClient)

    //set up a dependency on ws server from ws client.
    lifecycle(client).dependsOn(viewServer)

    //lifecycle registration is done in constructor of service classes, so sequence of create is important
    lifecycle.start()

    WaitForWebSocketConnectionToBeEstablished()

    vuuClient
  }

  private def WaitForWebSocketConnectionToBeEstablished(): Unit = {
    Thread.sleep(200)
  }
}
