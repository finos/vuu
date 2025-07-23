package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.ClientHelperFns
import org.finos.vuu.core.{VuuSSLByCertAndKey, VuuSSLByPKCS, VuuSSLCipherSuiteOptions, VuuSSLCipherSuiteOptionsImpl, VuuSSLDisabled, VuuSecurityOptions, VuuServer, VuuServerConfig, VuuWebSocketOptions}
import org.finos.vuu.net.WebSocketViewServerClient
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.junit.Assert.assertNotNull
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.atomic.AtomicInteger
import scala.collection.immutable.List

class WebSocketServerTest extends AnyFeatureSpec with Matchers with StrictLogging {

  val portCounter = new AtomicInteger(31820)

  Feature("Check we can start the WebSocketServer with various configurations") {

    Scenario("Start WebSocketServer with no SSL") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withSsl(VuuSSLDisabled())
          .withPort(0),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWss(VuuSSLDisabled())
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      val viewServer = new VuuServer(config)
      val client = new WebSocketClient(s"ws://localhost:$wsPort/websocket", wsPort)
      lifeCycle(client).dependsOn(viewServer)
      implicit val viewServerClient: WebSocketViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer)
      lifeCycle.start()

      Thread.sleep(500)
      val token = ClientHelperFns.auth("Mikey", "lolcats")
      assertNotNull(token)

      lifeCycle.thread.stop()
      lifeCycle.stop()
    }

    Scenario("Start WebSocketServer with SSL using Cert and Key") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withSsl(VuuSSLDisabled())
          .withPort(0),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWss(
            VuuSSLByCertAndKey(
              certPath = "example/main/src/main/resources/certs/cert.pem",
              keyPath = "example/main/src/main/resources/certs/key.pem"))
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      val viewServer = new VuuServer(config)
      val client = new WebSocketClient(s"wss://localhost:$wsPort/websocket", wsPort)
      lifeCycle(client).dependsOn(viewServer)
      implicit val viewServerClient: WebSocketViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer)
      lifeCycle.start()

      Thread.sleep(500)
      val token = ClientHelperFns.auth("Mikey", "lolcats")
      assertNotNull(token)

      lifeCycle.thread.stop()
      lifeCycle.stop()
    }

    Scenario("Start WebSocketServer with SSL using PKCS and Password") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withSsl(VuuSSLDisabled())
          .withPort(0),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWss(
            VuuSSLByPKCS(
              pkcsPath = "example/main/src/main/resources/certs/certificate.p12",
              pkcsPassword = "changeit"))
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      val viewServer = new VuuServer(config)
      val client = new WebSocketClient(s"wss://localhost:$wsPort/websocket", wsPort)
      lifeCycle(client).dependsOn(viewServer)
      implicit val viewServerClient: WebSocketViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer)
      lifeCycle.start()

      Thread.sleep(500)
      val token = ClientHelperFns.auth("Mikey", "lolcats")
      assertNotNull(token)

      lifeCycle.thread.stop()
      lifeCycle.stop()
    }

    Scenario("Start WebSocketServer with SSL using TLS 1.3 only") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withSsl(VuuSSLDisabled())
          .withPort(0),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWss(
            VuuSSLByCertAndKey(
              certPath = "example/main/src/main/resources/certs/cert.pem",
              keyPath = "example/main/src/main/resources/certs/key.pem",
              cipherSuite = VuuSSLCipherSuiteOptionsImpl(
                ciphers = List("TLS_AES_256_GCM_SHA384"),
                protocols = List("TLSv1.3"))
            )
          )
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      val viewServer = new VuuServer(config)
      val client = new WebSocketClient(s"wss://localhost:$wsPort/websocket", wsPort)
      lifeCycle(client).dependsOn(viewServer)
      implicit val viewServerClient: WebSocketViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer)
      lifeCycle.start()

      Thread.sleep(500)
      val token = ClientHelperFns.auth("Mikey", "lolcats")
      assertNotNull(token)

      lifeCycle.thread.stop()
      lifeCycle.stop()
    }

    Scenario("Start WebSocketServer with SSL using TLS 1.2 only") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withSsl(VuuSSLDisabled())
          .withPort(0),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWss(
            VuuSSLByCertAndKey(
              certPath = "example/main/src/main/resources/certs/cert.pem",
              keyPath = "example/main/src/main/resources/certs/key.pem",
              cipherSuite = VuuSSLCipherSuiteOptionsImpl(
                ciphers = List("TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"),
                protocols = List("TLSv1.2"))
            )
          )
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      val viewServer = new VuuServer(config)
      val client = new WebSocketClient(s"wss://localhost:$wsPort/websocket", wsPort)
      lifeCycle(client).dependsOn(viewServer)
      implicit val viewServerClient: WebSocketViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer)
      lifeCycle.start()

      Thread.sleep(500)
      val token = ClientHelperFns.auth("Mikey", "lolcats")
      assertNotNull(token)

      lifeCycle.thread.stop()
      lifeCycle.stop()
    }

  }

}
