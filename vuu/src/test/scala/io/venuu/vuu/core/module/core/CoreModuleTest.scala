package io.venuu.vuu.core.module.core

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.core.module.simul.SimulationModule
import io.venuu.vuu.core.{VuuServer, VuuServerConfig, VuuWebSocketOptions}
import io.venuu.vuu.net._
import io.venuu.vuu.net.http.VuuHttp2ServerOptions
import io.venuu.vuu.net.ws.WebSocketClient
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
/**
  * Created by chris on 18/09/2016.
  */
class CoreModuleTest extends AnyFeatureSpec with Matchers with StrictLogging with GivenWhenThen {

  import io.venuu.vuu.client.ClientHelperFns._

  def setupServer: (String, String, ViewServerClient, LifecycleContainer) = {

    implicit val metrics: MetricsProvider = new MetricsProviderImpl
    implicit val timeProvider: Clock = new DefaultClock
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer

    lifecycle.autoShutdownHook()

    val config = VuuServerConfig(
      VuuHttp2ServerOptions()
        .withWebRoot("vuu/src/main/resources/www")
        .withSsl("vuu/vuu/src/main/resources/certs/cert.pem", "vuu/vuu/src/main/resources/certs/key.pem")
        .withDirectoryListings(true),
      VuuWebSocketOptions()
        .withUri("websocket")
        .withWsPort(8090)
    ).withModule(SimulationModule())

    val viewServer = new VuuServer(config)

    val client = new WebSocketClient("ws://localhost:8090/websocket", 8090)

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

      val result = createVp(session, token, "chris", "instruments", columns)

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
