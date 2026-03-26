package org.finos.vuu.core.module.authn

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.json.JsonObject
import io.vertx.core.{Vertx, VertxOptions}
import io.vertx.ext.web.client.WebClientOptions
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.Async
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.{VuuClientConnectionOptions, VuuJoinTableProviderOptions, VuuSSLByCertAndKey, VuuSecurityOptions, VuuServer, VuuServerConfig, VuuThreadingOptions, VuuWebSocketOptions}
import org.finos.vuu.http2.server.VuuHttp2ServerFactory
import org.finos.vuu.http2.server.config.{AbsolutePathWebRoot, VuuHttp2ServerOptions, WebRootDisabled}
import org.finos.vuu.net.auth.LoginTokenService
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.atomic.AtomicBoolean

class AuthNServerTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("check we can add rest services and call them") {

    Scenario("validate the authn service") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val clock: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      val username = "Pikachu"
      val password = "IChooseYou!"
      val testUser = VuuUser(username)
      val loginTokenService: LoginTokenService = LoginTokenService(testUser)

      lifecycle.autoShutdownHook()

      val http = 10020
      val ws = 10030

      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWsPort(ws),
        VuuSecurityOptions()
          .withLoginTokenService(loginTokenService),
        VuuThreadingOptions(),
        VuuClientConnectionOptions(),
        VuuJoinTableProviderOptions(),
        List(AuthNModule(loginTokenService, Option(Map(username -> password)))),
        List.empty,
        VuuHttp2ServerFactory(VuuHttp2ServerOptions()
          .withPort(http))
      )

      val viewServer = new VuuServer(config)

      lifecycle.start()

      val vxoptions = new VertxOptions()

      val vertx = Vertx.vertx(vxoptions)

      import io.vertx.ext.web.client.WebClient

      Thread.sleep(5000)

      val wcoptions = new WebClientOptions()

      wcoptions.setVerifyHost(false)
      wcoptions.setTrustAll(true)

      val client = WebClient.create(vertx, wcoptions)

      println("Sending request....")

      val isSuccess = new AtomicBoolean(false)

      client.post(http, "127.0.0.1", "/api/authn")
        .ssl(false)
        .sendJsonObject(
          new JsonObject()
            .put("username", username)
            .put("password", password))
        .onSuccess(res => {
          isSuccess.set(true)
          println("SUCCESS:" + res.statusCode() + " " + res.statusMessage() + " " + res.getHeader("vuu-auth-token"))
        }).onFailure(res => {
          println("FAIL:" + res)
        })

      Async.waitTill(() => isSuccess.get())
    }
  }
}
