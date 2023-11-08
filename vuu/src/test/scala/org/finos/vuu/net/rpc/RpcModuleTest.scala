package org.finos.vuu.net.rpc

import org.finos.vuu.client.ClientHelperFns._
import org.finos.vuu.core.module.{MyObjectParam, TableDefContainer, TestModule}
import org.finos.vuu.core.{VuuSecurityOptions, VuuServer, VuuServerConfig, VuuWebSocketOptions}
import org.finos.vuu.net.WebSocketViewServerClient
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.concurrent.ExecutionContext

/**
  * RPC Functionality is being moved to the viewport, this test and old style RPC functionality should be removed.
 * TODO: Chris, Delete Me
  */
class RpcModuleTest extends AnyFeatureSpec with Matchers {

  Feature("check we can install a new module into the viewserver and call it"){

    ignore("add module and call an rpc call"){

      implicit val ctx = ExecutionContext.global

      //JmxInfra.enableJmx()

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

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
          .withWsPort(ws),
        VuuSecurityOptions()
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

      val returnVal = rpcCall(session, token, "chris", "AnRpcHandler", "onSendToMarket", Array(new MyObjectParam("foo", "bar")), "TEST")

      returnVal.result should equal(false)
      returnVal.error should be(null)

      val returnVal2 = rpcCall(session, token, "chris", "AnRpcHandler", "onSendToMarket", Array(new MyObjectParam("foo", "bar")), "NOT_EXISTS")

      returnVal2.error.message.take(17).toString should equal("Handler not found")

      lifecycle.stop()
    }
  }
}
