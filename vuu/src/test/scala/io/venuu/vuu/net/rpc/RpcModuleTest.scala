package io.venuu.vuu.net.rpc

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.core.module.{MyObjectParam, TestModule}
import io.venuu.vuu.core.{VuuServer, VuuServerConfig, VuuWebSocketOptions}
import io.venuu.vuu.net.http.VuuHttp2ServerOptions
import io.venuu.vuu.net.ws.WebSocketClient
import io.venuu.vuu.net.{JsonVsSerializer, WebSocketViewServerClient}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.concurrent.ExecutionContext

/**
  * Created by chris on 17/08/2016.
  */
class RpcModuleTest extends AnyFeatureSpec with Matchers {

  Feature("check we can install a new module into the viewserver and call it"){

    Scenario("add module and call an rpc call"){

      import io.venuu.vuu.client.ClientHelperFns._

      implicit val ctx = ExecutionContext.global

      //JmxInfra.enableJmx()

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

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
      ).withModule(TestModule())

      val viewServer = new VuuServer(config)

      val client = new WebSocketClient(s"ws://localhost:${ws}/websocket", ws)

      lifecycle(client).dependsOn(viewServer.server)

      implicit val vsClient = new WebSocketViewServerClient(client, JsonVsSerializer)

      lifecycle.start()

      //viewServer.join()

      //Thread.sleep(100)

      val token = auth("chris", "chris")
      val session = login(token, "chris")

      //Thread.sleep(200)

      val returnVal = rpcCall(session, token, "chris", "AnRpcHandler", "onSendToMarket", Array(new MyObjectParam("foo", "bar")), "TEST")

      returnVal.result should equal(false)
      returnVal.error should be(null)

      val returnVal2 = rpcCall(session, token, "chris", "AnRpcHandler", "onSendToMarket", Array(new MyObjectParam("foo", "bar")), "NOT_EXISTS")

      returnVal2.error.message.take(17).toString should equal("Handler not found")

      lifecycle.stop()
    }
  }
}
