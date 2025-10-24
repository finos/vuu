package org.finos.vuu.core.module.authn

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.json.JsonObject
import io.vertx.core.{Vertx, VertxOptions}
import io.vertx.ext.web.client.WebClientOptions
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.Async
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.vui.VuiStateModule
import org.finos.vuu.core.{VuuSSLByCertAndKey, VuuSecurityOptions, VuuServer, VuuServerConfig, VuuWebSocketOptions}
import org.finos.vuu.net.auth.{Authenticator, LoginTokenService}
import org.finos.vuu.net.http.{AbsolutePathWebRoot, VuuHttp2ServerOptions}
import org.finos.vuu.state.MemoryBackedVuiStateStore
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.finos.vuu.core.auths.VuuUser

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext

class AuthNServerTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("check we can add rest services and call them") {

    ignore("validate the authn service") {

      implicit val ctx = ExecutionContext.global

      //JmxInfra.enableJmx()

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val clock: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      val store = new MemoryBackedVuiStateStore()
      val loginTokenService: LoginTokenService = LoginTokenService()
      val authNRestAuthenticator = Authenticator(loginTokenService,
        (v1: Map[String, AnyRef]) => Right[String, VuuUser](VuuUser(String.valueOf(v1("username")))))

      lifecycle.autoShutdownHook()

      val https = 10020
      val ws = 10030

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withWebRoot(AbsolutePathWebRoot("vuu/src/main/resources/www", directoryListings = true))
          .withSsl(VuuSSLByCertAndKey("vuu/src/main/resources/certs/cert.pem", "vuu/src/main/resources/certs/key.pem"))
          .withPort(https),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWsPort(ws),
        VuuSecurityOptions()
          .withLoginTokenService(loginTokenService)
      ).withModule(VuiStateModule(store))
       .withModule(AuthNModule(authNRestAuthenticator))

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
