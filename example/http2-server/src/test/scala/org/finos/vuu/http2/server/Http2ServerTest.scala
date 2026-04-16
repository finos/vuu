package org.finos.vuu.http2.server

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.Vertx
import io.vertx.ext.web.client.{HttpRequest, WebClient, WebClientOptions}
import org.finos.vuu.net.ssl.{VuuSSLByCertAndKey, VuuSSLByPKCS, VuuSSLCipherSuiteOptions, VuuSSLDisabled}
import org.finos.vuu.http2.server.config.VuuHttp2ServerOptions
import org.scalatest.concurrent.Eventually.eventually
import org.scalatest.concurrent.Futures.timeout
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.time.{Seconds, Span}

import java.util.concurrent.atomic.AtomicReference
import java.util.concurrent.{CountDownLatch, TimeUnit}
import scala.jdk.CollectionConverters.SetHasAsJava

class Http2ServerTest extends AnyFeatureSpec with Matchers with StrictLogging {

  private val certPath: String = getClass.getClassLoader.getResource("certs/cert.pem").getPath
  private val keyPath: String = getClass.getClassLoader.getResource("certs/key.pem").getPath
  private val pkcsPath: String = getClass.getClassLoader.getResource("certs/certificate.p12").getPath
  private val pkcsPassword = "changeit"

  Feature("Check we can start the HTTP2 Server with various configurations") {

    Scenario("Start HTTP2 Server with no SSL") {

      val config = VuuHttp2ServerOptions()
        .withSsl(VuuSSLDisabled)
        .withPort(0)

      val webServer = createAndStartWebServer(config)
      val webClient = createWebClient()

      sendAndAssertResponse(webClient.get(webServer.getPort, "0.0.0.0", "/api/echo/sslDisabled").ssl(false), "sslDisabled")

      stopWebServer(webServer)
    }

    Scenario("Start HTTP2 Server with SSL using Cert and Key") {

      val config = VuuHttp2ServerOptions()
        .withSsl(VuuSSLByCertAndKey(certPath, keyPath))
        .withPort(0)

      val webServer = createAndStartWebServer(config)
      val webClient = createWebClient()

      sendAndAssertResponse(webClient.get(webServer.getPort, "0.0.0.0", "/api/echo/sslEnabled").ssl(true), "sslEnabled")

      stopWebServer(webServer)
    }

    Scenario("Start HTTP2 Server with SSL using PKCS") {

      val config = VuuHttp2ServerOptions()
        .withSsl(VuuSSLByPKCS(pkcsPath, pkcsPassword))
        .withPort(0)

      val webServer = createAndStartWebServer(config)
      val webClient = createWebClient()

      sendAndAssertResponse(webClient.get(webServer.getPort, "0.0.0.0", "/api/echo/sslPKCS").ssl(true), "sslPKCS")

      stopWebServer(webServer)
    }

    Scenario("Start HTTP2 Server with SSL using TLS 1.3 only") {

      val config = VuuHttp2ServerOptions()
        .withSsl(VuuSSLByPKCS(
          pkcsPath,
          pkcsPassword,
          cipherSuite = VuuSSLCipherSuiteOptions()
            .withCiphers(List("TLS_AES_256_GCM_SHA384"))
            .withProtocols(List("TLSv1.3"))))
        .withPort(0)

      val webServer = createAndStartWebServer(config)
      val webClient = createWebClient()

      sendAndAssertResponse(webClient.get(webServer.getPort, "0.0.0.0", "/api/echo/TLSv1.3").ssl(true), "TLSv1.3")

      stopWebServer(webServer)
    }

    Scenario("Start HTTP2 Server with SSL using TLS 1.2 only") {

      val config = VuuHttp2ServerOptions()
        .withSsl(VuuSSLByPKCS(
          pkcsPath,
          pkcsPassword,
          cipherSuite = VuuSSLCipherSuiteOptions()
            .withCiphers(List("TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"))
            .withProtocols(List("TLSv1.2"))))
        .withPort(0)

      val webServer = createAndStartWebServer(config)
      val webClient = createWebClient(protocol = "TLSv1.2", cipher = "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384")

      sendAndAssertResponse(webClient.get(webServer.getPort, "0.0.0.0", "/api/echo/TLSv1.2").ssl(true), "TLSv1.2")

      stopWebServer(webServer)
    }

  }

  private def createAndStartWebServer(options: VuuHttp2ServerOptions): Http2Server = {
    val server = Http2Server(options, List(EchoRestService))
    server.doStart()
    eventually(timeout(Span(10, Seconds))) {
      server.isRunning shouldBe true
    }
    server
  }

  private def stopWebServer(server: Http2Server): Unit = {
    server.doStop()
    eventually(timeout(Span(10, Seconds))) {
      server.isRunning shouldBe false
    }
  }

  private def createWebClient(protocol: String = "TLSv1.3", cipher: String = "TLS_AES_256_GCM_SHA384"): WebClient = {
    val webClientOptions = new WebClientOptions()
      .setVerifyHost(false)
      .setTrustAll(true)
      .setEnabledSecureTransportProtocols(Set(protocol).asJava)
      .addEnabledCipherSuite(cipher)
    WebClient.create(Vertx.vertx(), webClientOptions)
  }

  private def sendAndAssertResponse(httpRequest: HttpRequest[?], expected: String): Unit = {
    val errorMessage = new AtomicReference[String]()
    val countDownLatch = new CountDownLatch(1)

    httpRequest
      .send()
      .onSuccess(res => {
        if (res.statusCode() != 200 || expected != res.bodyAsString()) {
          errorMessage.set(s"Failed with Status: ${res.statusCode()} & Body: ${res.bodyAsString()}")
        }
        countDownLatch.countDown()
      })
      .onFailure(throwable => {
        errorMessage.set(s"Failed: $throwable")
        countDownLatch.countDown()
      })

    countDownLatch.await(1, TimeUnit.SECONDS)
    errorMessage.get() shouldEqual null
  }

}

