package io.venuu.vuu.core.module.core

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{DefaultTimeProvider, TimeProvider}
import io.venuu.vuu.core.module.simul.SimulationModule
import io.venuu.vuu.core.{ViewServer, ViewServerConfig}
import io.venuu.vuu.net.ws.WebSocketClient
import io.venuu.vuu.net._
import io.venuu.vuu.net.auth._
import org.scalatest.{FeatureSpec, _}

/**
  * Created by chris on 18/09/2016.
  */
class CoreModuleTest extends FeatureSpec with Matchers with StrictLogging with GivenWhenThen {

  import io.venuu.vuu.client.ClientHelperFns._

  def setupServer: (String, String, ViewServerClient, LifecycleContainer) = {

    implicit val metrics: MetricsProvider = new MetricsProviderImpl
    implicit val timeProvider: TimeProvider = new DefaultTimeProvider
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer

    lifecycle.autoShutdownHook()

    val config = ViewServerConfig(8080, 8443, 8090, "src/main/resources/www")
      .withModule(SimulationModule())

    val viewServer = new ViewServer(config)

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

  feature("Check user interation vs the real running server"){

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

      successChange.groupBy.deep should equal( Array("currency").deep )

      lifecycle.stop()
    }

  }

}
