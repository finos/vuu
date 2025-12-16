package org.finos.vuu.net.ws;

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.Vertx
import io.vertx.core.http.HttpMethod
import io.vertx.ext.web.client.{WebClient, WebClientOptions}
import org.awaitility.Awaitility.await
import org.awaitility.scala.AwaitilitySupport
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.*
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.time.Duration
import java.util.concurrent.CountDownLatch
import java.util.concurrent.atomic.AtomicInteger
import scala.jdk.CollectionConverters.{IterableHasAsScala, SetHasAsJava}

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

      val viewServer = VuuServer(config)
      lifeCycle.start()

      val webClient = createWebClient()

      for (method <- IterableHasAsScala(HttpMethod.values()).asScala) {

        val countDownLatch = CountDownLatch(1)
        val status: AtomicInteger = AtomicInteger(400)

        val response = webClient.request(method, config.wsOptions.wsPort, "localhost", "/websocket").ssl(true)
          .send()
          .onSuccess(res => {
            status.set(res.statusCode())
            countDownLatch.countDown()
          })
          .onFailure(throwable => {
            countDownLatch.countDown()
          })

        countDownLatch.await()
        status.get() should equal(400)
      }

      stopLifeCycle()
    }

    Scenario("Check anonymous websocket connections are closed on first message") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifeCycle: LifecycleContainer = LifecycleContainer()

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

  private def createWebClient(protocol: String = "TLSv1.3", cipher: String = "TLS_AES_256_GCM_SHA384"): WebClient = {
    val webClientOptions = WebClientOptions()
      .setVerifyHost(false)
      .setTrustAll(true)
      .setEnabledSecureTransportProtocols(Set(protocol).asJava)
      .addEnabledCipherSuite(cipher)
    WebClient.create(Vertx.vertx(), webClientOptions)
  }

  private def createClient(config: VuuServerConfig, viewServer: VuuServer)
                          (implicit lifecycle: LifecycleContainer, timeProvider: Clock, metricsProvider: MetricsProvider): WebSocketClient = {
    val protocol = config.wsOptions.sslOptions match {
      case VuuSSLDisabled() => "ws"
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
