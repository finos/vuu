package io.venuu.vuu.core.module.authn

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.thread.Async
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.core.{VuuSecurityOptions, VuuServer, VuuServerConfig, VuuWebSocketOptions}
import io.venuu.vuu.core.module.vui.VuiStateModule
import io.venuu.vuu.net.{Authenticator, LoggedInTokenValidator}
import io.venuu.vuu.net.auth.AlwaysHappyAuthenticator
import io.venuu.vuu.net.http.VuuHttp2ServerOptions
import io.venuu.vuu.state.MemoryBackedVuiStateStore
import io.vertx.core.{Vertx, VertxOptions}
import io.vertx.core.json.JsonObject
import io.vertx.ext.web.client.WebClientOptions
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.{Await, ExecutionContext}

class AuthNServerTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("check we can add rest services and call them") {

    ignore("validate the authn service") {

      implicit val ctx = ExecutionContext.global

      //JmxInfra.enableJmx()

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val clock: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val store = new MemoryBackedVuiStateStore()
      val authenticator: Authenticator = new AlwaysHappyAuthenticator
      val loginTokenValidator: LoggedInTokenValidator = new LoggedInTokenValidator

      lifecycle.autoShutdownHook()

      val https = 10020
      val ws = 10030

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withWebRoot("vuu/src/main/resources/www")
          .withSsl("vuu/src/main/resources/certs/cert.pem", "vuu/src/main/resources/certs/key.pem")
          .withDirectoryListings(true)
          .withPort(https),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWsPort(ws),
        VuuSecurityOptions()
      ).withModule(VuiStateModule(store))
       .withModule(AuthNModule(authenticator, loginTokenValidator))

      val viewServer = new VuuServer(config)

      lifecycle.start()

      val vxoptions = new VertxOptions()

      val vertx = Vertx.vertx(vxoptions)

      import io.vertx.ext.web.client.WebClient

      Thread.sleep(5000)

      val  wcoptions = new WebClientOptions()

      wcoptions.setVerifyHost(false)
      wcoptions.setTrustAll(true)

      val client = WebClient.create(vertx, wcoptions)

      println("Sending request....")

      val isSuccess = new AtomicBoolean(false)

      client.post(https, "127.0.0.1", "/api/authn")
        .ssl(true)
        .sendJsonObject(
          new JsonObject()
            .put("user", "chris")
            .put("password", "chris"))
        .onSuccess( res => {
          isSuccess.set(true)
          println("SUCCESS:" + res.statusCode() + " " + res.statusMessage() + " " + res.getHeader("vuu-auth-token"))
        }).onFailure( res =>{
        println("FAIL:" + res)
      })

      Async.waitTill(() => isSuccess.get())
    }
  }
}
