package io.venuu.vuu.net.rest

import com.typesafe.scalalogging.StrictLogging
import io.netty.util.CharsetUtil
import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.core.{VuuServer, VuuServerConfig, VuuWebSocketOptions}
import io.venuu.vuu.core.module.TestModule
import io.venuu.vuu.core.module.vui.VuiStateModule
import io.venuu.vuu.net.{JsonVsSerializer, WebSocketViewServerClient}
import io.venuu.vuu.net.http.VuuHttp2ServerOptions
import io.venuu.vuu.net.ws.WebSocketClient
import io.venuu.vuu.state.MemoryBackedVuiStateStore
import io.vertx.core.json.JsonObject
import io.vertx.core.{Vertx, VertxOptions}
import io.vertx.ext.web.client.WebClientOptions
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.nio.charset.Charset
import scala.concurrent.ExecutionContext

class RestServiceTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("check we can add rest services and call them") {

    ignore("add the ui state rest service") {

      import io.venuu.vuu.client.ClientHelperFns._

      implicit val ctx = ExecutionContext.global

      //JmxInfra.enableJmx()

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val clock: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val store = new MemoryBackedVuiStateStore()

      lifecycle.autoShutdownHook()

      val http = 10001
      val https = 10002
      val ws = 10003

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withWebRoot("vuu/src/main/resources/www")
          .withSsl("vuu/src/main/resources/certs/cert.pem", "vuu/src/main/resources/certs/key.pem")
          .withDirectoryListings(true)
          .withPort(https),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWsPort(ws)
      ).withModule(VuiStateModule(store))

      val viewServer = new VuuServer(config)

      lifecycle.start()

      val vxoptions = new VertxOptions();

      val vertx = Vertx.vertx(vxoptions);

      import io.vertx.ext.web.client.WebClient

      Thread.sleep(2000)

      val  wcoptions = new WebClientOptions()

      wcoptions.setVerifyHost(false)
      wcoptions.setTrustAll(true)

      val client = WebClient.create(vertx, wcoptions)

      Thread.sleep(100)

      client.put(https, "localhost", "/api/vui/chris/latest")
        .ssl(true)
        .sendJsonObject(
          new JsonObject()
            .put("firstName", "Yo")
            .put("lastName", "Stevo"))
        .onSuccess( res => {
            logger.info("SUCCESS:" + res)
        }).onFailure( res =>{
          logger.error("FAIL:" + res.toString, res)
        })

      client.post(https, "localhost", "/api/vui/chris")
        .ssl(true)
        .sendJsonObject(
          new JsonObject()
            .put("firstName", "Yo")
            .put("lastName", "Stevo"))
        .onSuccess( res => {
          println("SUCCESS:" + res)
        }).onFailure( res =>{
        println("FAIL:" + res)
      })

      client.get(https, "localhost", "/api/vui/chris")
        .ssl(true)
        .send()
        .onSuccess( res => {
          println("GET SUCCESS:" + res.body().toString(CharsetUtil.UTF_8) )
        }).onFailure( res =>{
        println("GET FAIL:" + res)
      })

      client.get(https, "localhost", "/api/vui/chris")
        .ssl(true)
        .send()
        .onSuccess( res => {
          println("GET SUCCESS:" + res.body().toString(CharsetUtil.UTF_8))
        }).onFailure( res =>{
        println("GET FAIL:" + res)
      })

      Thread.sleep(100_000)

      lifecycle.stop()
    }
  }
}
