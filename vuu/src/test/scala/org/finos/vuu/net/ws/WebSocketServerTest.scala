package org.finos.vuu.net.ws

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.{ClientHelperFns, VuuClientOptions, VuuClientSSLByTrustStore, VuuClientSSLDisabled}
import org.finos.vuu.core.*
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.WebSocketViewServerClient
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.atomic.AtomicInteger

class WebSocketServerTest extends AnyFeatureSpec with Matchers with StrictLogging {

  private val certPath: String = getClass.getClassLoader.getResource("certs/cert.pem").getPath
  private val keyPath: String = getClass.getClassLoader.getResource("certs/key.pem").getPath
  private val pkcsPath: String = getClass.getClassLoader.getResource("certs/certificate.p12").getPath
  private val trustStorePath: String = getClass.getClassLoader.getResource("certs/truststore.jks").getPath
  private val portCounter = new AtomicInteger(31820)
  private val pkcsPassword = "changeit"
  private val trustStorePassword = "changeit"

  Feature("Check we can start the WebSocketServer with various configurations") {

    Scenario("Start WebSocketServer with no SSL") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withSsl(VuuSSLDisabled)
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val token = config.security.loginTokenService.getToken(VuuUser("Mikey"))
      val sessionId = ClientHelperFns.login(token)
      sessionId should not equal null

      stopLifeCycle()
    }

    Scenario("Start WebSocketServer with no Compression") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withSsl(VuuSSLDisabled)
          .withWsPort(wsPort)
          .withCompression(false),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val token = config.security.loginTokenService.getToken(VuuUser("Mikey"))
      val sessionId = ClientHelperFns.login(token)
      sessionId should not equal null

      stopLifeCycle()
    }

    Scenario("Start WebSocketServer with no native transport") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withSsl(VuuSSLDisabled)
          .withWsPort(wsPort)
          .withNativeTransport(false),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val token = config.security.loginTokenService.getToken(VuuUser("Mikey"))
      val sessionId = ClientHelperFns.login(token)
      sessionId should not equal null

      stopLifeCycle()
    }

    Scenario("Start WebSocketServer with SSL using Cert and Key") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withSsl(
            VuuSSLByCertAndKey(certPath, keyPath))
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val token = config.security.loginTokenService.getToken(VuuUser("Mikey"))
      val sessionId = ClientHelperFns.login(token)
      sessionId should not equal null

      stopLifeCycle()
    }

    Scenario("Start WebSocketServer with SSL using PKCS and Password") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withSsl(
            VuuSSLByPKCS(pkcsPath, pkcsPassword))
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val token = config.security.loginTokenService.getToken(VuuUser("Mikey"))
      val sessionId = ClientHelperFns.login(token)
      sessionId should not equal null

      stopLifeCycle()
    }

    Scenario("Start WebSocketServer with SSL using TLS 1.3 only") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
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

      val token = config.security.loginTokenService.getToken(VuuUser("Mikey"))
      val sessionId = ClientHelperFns.login(token)
      sessionId should not equal null

      stopLifeCycle()
    }

    Scenario("Start WebSocketServer with SSL using TLS 1.2 only") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
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

      val token = config.security.loginTokenService.getToken(VuuUser("Mikey"))
      val sessionId = ClientHelperFns.login(token)
      sessionId should not equal null

      stopLifeCycle()
    }

    Scenario("Start WebSocketServer with max sessions per user") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
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
          .withWsPort(wsPort)
        .withMaxSessionsPerUser(2),
        VuuSecurityOptions()
      )

      implicit val viewServerClient: WebSocketViewServerClient = createClient(config)

      val token = config.security.loginTokenService.getToken(VuuUser("Mikey"))
      val sessionId = ClientHelperFns.login(token)
      sessionId should not equal null

      stopLifeCycle()
    }

  }

  private def createClient(config: VuuServerConfig)(implicit lifecycle: LifecycleContainer, timeProvider: Clock, metricsProvider: MetricsProvider): WebSocketViewServerClient = {
    val viewServer = new VuuServer(config)
    val options = VuuClientOptions()
      .withPath(config.wsOptions.uri)
      .withPort(config.wsOptions.wsPort)
      .withSsl(config.wsOptions.sslOptions match {
        case VuuSSLDisabled => VuuClientSSLDisabled
        case _ => VuuClientSSLByTrustStore(trustStorePath, trustStorePassword)
      })
      .withCompression(config.wsOptions.compressionEnabled)
      .withNativeTransport(config.wsOptions.nativeTransportEnabled)
    val client = new WebSocketClient(options)
    lifecycle(client).dependsOn(viewServer)
    val viewServerClient: WebSocketViewServerClient = new WebSocketViewServerClient(client)
    lifecycle.start()
    viewServerClient
  }

  private def stopLifeCycle()(implicit lifecycle: LifecycleContainer): Unit = {
    lifecycle.thread.stop()
    lifecycle.stop()
  }

}
