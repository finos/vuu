package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.ClientHelperFns
import org.finos.vuu.core.*
import org.finos.vuu.net.WebSocketViewServerClient
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.junit.Assert.assertNotNull
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.atomic.AtomicInteger

class WebSocketServerTest extends AnyFeatureSpec with Matchers with StrictLogging {

  private val certPath: String = getClass.getClassLoader.getResource("certs/cert.pem").getPath
  private val keyPath: String = getClass.getClassLoader.getResource("certs/key.pem").getPath
  private val pkcsPath: String = getClass.getClassLoader.getResource("certs/certificate.p12").getPath
  private val portCounter = new AtomicInteger(31820)
  private val pkcsPassword = "changeit"

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
          .withSsl(VuuSSLDisabled())
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val sessionId = ClientHelperFns.login("Mikey", "lolcats")
      assertNotNull(sessionId)

      stopLifeCycle()
    }

    Scenario("Start WebSocketServer with no Compression") {

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
          .withSsl(VuuSSLDisabled())
          .withWsPort(wsPort)
          .withCompression(false),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val sessionId = ClientHelperFns.login("Mikey", "lolcats")
      assertNotNull(sessionId)

      stopLifeCycle()
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
          .withSsl(
            VuuSSLByCertAndKey(certPath, keyPath))
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val sessionId = ClientHelperFns.login("Mikey", "lolcats")
      assertNotNull(sessionId)

      stopLifeCycle()
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
          .withSsl(
            VuuSSLByPKCS(pkcsPath, pkcsPassword))
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val sessionId = ClientHelperFns.login("Mikey", "lolcats")
      assertNotNull(sessionId)

      stopLifeCycle()
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
          .withSsl(
            VuuSSLByCertAndKey(
              certPath,
              keyPath,
              cipherSuite = VuuSSLCipherSuiteOptions()
                .withCiphers(List("TLS_AES_256_GCM_SHA384"))
                .withProtocols(List("TLSv1.3"))
            )
          )
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val sessionId = ClientHelperFns.login("Mikey", "lolcats")
      assertNotNull(sessionId)

      stopLifeCycle()
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
          .withSsl(
            VuuSSLByCertAndKey(
              certPath,
              keyPath,
              cipherSuite = VuuSSLCipherSuiteOptions()
                .withCiphers(List("TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"))
                .withProtocols(List("TLSv1.2"))
            )
          )
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val sessionId = ClientHelperFns.login("Mikey", "lolcats")
      assertNotNull(sessionId)

      stopLifeCycle()
    }

  }

  private def createClient(config: VuuServerConfig)(implicit lifecycle: LifecycleContainer, timeProvider: Clock, metricsProvider: MetricsProvider): WebSocketViewServerClient = {
    val viewServer = new VuuServer(config)
    val protocol = config.wsOptions.sslOptions match {
      case VuuSSLDisabled() => "ws"
      case _ => "wss"
    }
    val client = new WebSocketClient(s"$protocol://localhost:${config.wsOptions.wsPort}/websocket", config.wsOptions.wsPort)
    lifecycle(client).dependsOn(viewServer)
    val viewServerClient: WebSocketViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer())
    lifecycle.start()
    viewServerClient
  }

  private def stopLifeCycle()(implicit lifecycle: LifecycleContainer): Unit = {
    lifecycle.thread.stop()
    lifecycle.stop()
  }

}
