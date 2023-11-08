package org.finos.vuu.core.module.core

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.client.ClientHelperFns._
import org.finos.vuu.core.module.simul.SimulationModule
import org.finos.vuu.core.{VuuSecurityOptions, VuuServer, VuuServerConfig, VuuWebSocketOptions}
import org.finos.vuu.net.{ChangeViewPortSuccess, CreateViewPortSuccess, SortSpec, ViewServerClient, WebSocketViewServerClient}
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.viewport.ViewPortTable
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.TableDefContainer
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class CoreModuleTest extends AnyFeatureSpec with Matchers with StrictLogging with GivenWhenThen {

  def setupServer: (String, String, ViewServerClient, LifecycleContainer) = {

    implicit val metrics: MetricsProvider = new MetricsProviderImpl
    implicit val timeProvider: Clock = new DefaultClock
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer
    implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

    lifecycle.autoShutdownHook()

    val config = VuuServerConfig(
      VuuHttp2ServerOptions()
        .withWebRoot("vuu/src/main/resources/www")
        .withSsl("vuu/src/main/resources/certs/cert.pem", "vuu/src/main/resources/certs/key.pem")
        .withDirectoryListings(true),
      VuuWebSocketOptions()
        .withUri("websocket")
        .withWsPort(8090)
        .withWss("vuu/src/main/resources/certs/cert.pem", "vuu/src/main/resources/certs/key.pem"),
        VuuSecurityOptions()
    ).withModule(SimulationModule())

    val viewServer = new VuuServer(config)

    val client = new WebSocketClient("wss://localhost:8090/websocket", 8090)

    lifecycle(client).dependsOn(viewServer.server)

    implicit val vsClient = new WebSocketViewServerClient(client, JsonVsSerializer)

    lifecycle.start()

    //viewServer.join()

    Thread.sleep(100)

    val token = auth("chris", "chris")
    val session = login(token, "chris")

    Thread.sleep(200)

    (token, session, vsClient, lifecycle)
  }

  Feature("Check user interation vs the real running server"){

    ignore("check we can swap a viewport from non-tree to tree and back"){

      val (token, session, client, lifecycle) = setupServer

      implicit val theClient: ViewServerClient = client

      val columns = Array("ric", "description", "currency", "exchange", "lotSize")

      val result = createVp(session, token, "chris", ViewPortTable("instruments", "SIMUL"), columns)

      val success: CreateViewPortSuccess = result.body match {
        case success: CreateViewPortSuccess => success
        case other => throw new Exception("things went bad" + other)
      }

      val changeResult = changeVp(session, token, success.viewPortId, "chris", success.table, columns,
                                  SortSpec(List()), Array("currency"))


      val successChange = changeResult.body.asInstanceOf[ChangeViewPortSuccess]

      successChange.groupBy should equal( Array("currency") )

      lifecycle.stop()
    }

  }

}
