package org.finos.vuu.net.ws;

import com.typesafe.scalalogging.StrictLogging
import org.awaitility.Awaitility.await
import org.awaitility.scala.AwaitilitySupport
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.*
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.net.URI
import java.net.http.HttpRequest.BodyPublishers
import java.net.http.HttpResponse.BodyHandlers
import java.net.http.{HttpClient, HttpRequest}
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.time.Duration
import java.util.concurrent.atomic.AtomicInteger
import javax.net.ssl.{SSLContext, SSLParameters, TrustManager, X509TrustManager}

class WebSocketSecurityTest extends AnyFeatureSpec with Matchers with AwaitilitySupport with StrictLogging {

  private val pkcsPath: String = getClass.getClassLoader.getResource("certs/certificate.p12").getPath
  private val portCounter = AtomicInteger(31820)
  private val pkcsPassword = "changeit"

  Feature("Assorted security tests") {

    Scenario("Check HTTP requests other than WebSocket upgrade are rejected") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifeCycle: LifecycleContainer = LifecycleContainer()

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withSsl(
            VuuSSLByPKCS(pkcsPath, pkcsPassword))
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      val viewServer = VuuServer(config)
      lifeCycle.start()

      val webClient = createWebClient()
      val methods = Array("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS")

      for (method <- methods) {

        val bodyPublisher = method match {
          case "POST" | "PUT" | "PATCH" => BodyPublishers.ofString("{}")
          case _ => BodyPublishers.noBody()
        }

        val request = HttpRequest.newBuilder()
          .uri(URI.create(s"https://localhost:$wsPort/websocket"))
          .method(method, bodyPublisher)
          .build()

        val response = webClient.send(request, BodyHandlers.ofString())
        response.statusCode() shouldEqual 400
      }

      stopLifeCycle()
    }

    Scenario("Check anonymous websocket connections are closed on first message") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifeCycle: LifecycleContainer = LifecycleContainer()

      val wsPort = portCounter.getAndIncrement()

      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withSsl(
            VuuSSLByPKCS(pkcsPath, pkcsPassword))
          .withWsPort(wsPort),
        VuuSecurityOptions()
      )

      val viewServer = VuuServer(config)
      val webSocketClient = createClient(config, viewServer)
      lifeCycle.start()

      await atMost {
        Duration.ofSeconds(5)
      } until {
        webSocketClient.canWrite
      }

      webSocketClient.write("{\n  \"roles\": [\"user\", {\"$type\":\"system\"}]\n}")

      await atMost {
        Duration.ofSeconds(5)
      } until {
        !webSocketClient.canWrite
      }

    }
    
  }

  private def createWebClient(protocol: String = "TLSv1.3", cipher: String = "TLS_AES_256_GCM_SHA384"): HttpClient = {
    val trustAllCerts = Array[TrustManager](new X509TrustManager() {
      def getAcceptedIssuers: Array[X509Certificate] = null
      def checkClientTrusted(certs: Array[X509Certificate], authType: String): Unit = { }
      def checkServerTrusted(certs: Array[X509Certificate], authType: String): Unit = { }
    })
    
    val sslContext = SSLContext.getInstance(protocol)
    sslContext.init(null, trustAllCerts, new SecureRandom)

    val sslParams = new SSLParameters
    sslParams.setProtocols(Array[String](protocol))
    sslParams.setCipherSuites(Array[String](cipher))
    sslParams.setEndpointIdentificationAlgorithm("")
    HttpClient.newBuilder.sslContext(sslContext).sslParameters(sslParams).build
  }

  private def createClient(config: VuuServerConfig, viewServer: VuuServer)
                          (implicit lifecycle: LifecycleContainer, timeProvider: Clock, metricsProvider: MetricsProvider): WebSocketClient = {
    val protocol = config.wsOptions.sslOptions match {
      case VuuSSLDisabled => "ws"
      case _ => "wss"
    }
    val client = new WebSocketClient(s"$protocol://localhost:${config.wsOptions.wsPort}/websocket", config.wsOptions.wsPort)
    lifecycle(client).dependsOn(viewServer)
    client
  }

  private def stopLifeCycle()(using lifecycle: LifecycleContainer): Unit = {
    lifecycle.thread.stop()
    lifecycle.stop()
  }

}
