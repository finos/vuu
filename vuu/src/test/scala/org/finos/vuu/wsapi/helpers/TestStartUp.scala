package org.finos.vuu.wsapi.helpers

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.client.{VuuClientOptions, VuuClientSSLDisabled}
import org.finos.vuu.core.*
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.net.{ViewServerClient, WebSocketViewServerClient}
import org.scalatest.concurrent.Eventually
import org.scalatest.matchers.should.Matchers
import org.scalatest.time.{Seconds, Span}

import java.security.SecureRandom

class TestStartUp(moduleFactoryFunc: () => ViewServerModule)(
                  using val timeProvider: Clock,
                  val lifecycle: LifecycleContainer,
                  val tableDefContainer: TableDefContainer) extends Eventually with Matchers {

  def startServerAndClient(): (TestVuuClient, VuuServerConfig) = {

    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    lifecycle.autoShutdownHook()

    val minValue = 10011
    val rand = new SecureRandom()
    val http = rand.nextInt(500) + minValue
    val ws = rand.nextInt(500) + minValue

    val module: ViewServerModule = moduleFactoryFunc()
        
    val config = VuuServerConfig(
      VuuWebSocketOptions()
        .withBindAddress("0.0.0.0")
        .withUri("websocket")
        .withWsPort(ws)
        .withSslDisabled(),
      VuuSecurityOptions(),
      VuuThreadingOptions(),
      VuuClientConnectionOptions()
        .withHeartbeatDisabled()
    )
      .withModule(module)

    val viewServer = new VuuServer(config)

    val options = VuuClientOptions()
      .withPath(config.wsOptions.uri)
      .withPort(config.wsOptions.wsPort)
      .withSsl(config.wsOptions.sslOptions match {
        case VuuSSLDisabled => VuuClientSSLDisabled
        case _ => VuuClientSSLDisabled
      })
      .withCompression(config.wsOptions.compressionEnabled)
      .withNativeTransport(config.wsOptions.nativeTransportEnabled)
    val client = new WebSocketClient(options)
    val viewServerClient: ViewServerClient = new WebSocketViewServerClient(client)
    val vuuClient = new TestVuuClient(viewServerClient, config.security.loginTokenService)

    //set up a dependency on ws server from ws client.
    lifecycle(client).dependsOn(viewServer)

    //lifecycle registration is done in constructor of service classes, so sequence of create is important
    lifecycle.start()

    eventually(timeout(Span(1, Seconds))) {
      vuuClient.isConnected shouldBe true
    }

    (vuuClient, config)
  }

}
