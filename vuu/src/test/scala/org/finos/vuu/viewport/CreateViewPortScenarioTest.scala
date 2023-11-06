package org.finos.vuu.viewport

import org.finos.vuu.api._
import org.finos.vuu.client.ClientHelperFns._
import org.finos.vuu.core.module.simul.SimulationModule
import org.finos.vuu.core.table.{Columns, DataTable}
import org.finos.vuu.core.{VuuSecurityOptions, VuuServer, VuuServerConfig, VuuWebSocketOptions}
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.net.{CreateViewPortSuccess, TableRowUpdates, WebSocketViewServerClient}
import org.finos.vuu.provider.Provider
import org.finos.vuu.provider.simulation.{SimulatedBigInstrumentsProvider, SimulatedPricesProvider}
import org.finos.toolbox.jmx.{JmxInfra, MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.json.JsonUtil
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.{LifeCycleRunner, Runner}
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.TableDefContainer
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.concurrent.{ExecutionContext, Future}
import scala.io.Source

class CreateViewPortScenarioTest extends AnyFeatureSpec with Matchers {

  Feature("check creation of view port via client api") {

    def loadStatic: Array[Array[String]] = {

      println(new java.io.File("./src/main/resources/static/ftse100.csv").getCanonicalPath())

      val bufferedSource = Source.fromFile(new java.io.File("./src/main/resources/static/ftse100.csv"))
      val csv = for (line <- bufferedSource.getLines) yield line.split(",").map(_.trim)
      val array = csv.toArray
      bufferedSource.close
      array
    }

    def getInstProvider(data: Array[Array[String]], table: DataTable)(implicit timeProvider: Clock, lifecycleContainer: LifecycleContainer): Provider = {
      new SimulatedBigInstrumentsProvider(table)
    }

    def createTables(viewServer: VuuServer): (DataTable, DataTable, DataTable) = {
      val instrumentDef = TableDef(
        name = "instruments",
        keyField = "ric",
        columns = Columns.fromNames("ric:String", "description:String", "gen1:String", "gen2:Long", "gen3:String"),
        joinFields = "ric"
      )

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "scenario: String"), "ric")

      val instrumentPricesDef = JoinTableDef(
        name = "instrumentPrices",
        baseTable = instrumentDef,
        joinColumns = Columns.allFrom(instrumentDef) ++ Columns.allFromExcept(pricesDef, "ric"),
        joins =
          JoinTo(
            table = pricesDef,
            joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
          ),
        joinFields = Seq()
      )

      val instruments = viewServer.createTable(instrumentDef)
      val prices = viewServer.createAutoSubscribeTable(pricesDef)
      val instrumentPrices = viewServer.createJoinTable(instrumentPricesDef)

      (instruments, prices, instrumentPrices)
    }

    //this needs to be set as JVM param.

    ignore("create viewport and see tick") {

      implicit val ctx = ExecutionContext.global

      JmxInfra.enableJmx()

      implicit val timeProvider: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          .withWebRoot("vuu/src/main/resources/www")
          .withSsl("vuu/vuu/src/main/resources/certs/cert.pem", "vuu/vuu/src/main/resources/certs/key.pem")
          .withDirectoryListings(true),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWsPort(8090),
        VuuSecurityOptions()
      ).withModule(SimulationModule())

      val viewServer = new VuuServer(config)

      val client = new WebSocketClient("ws://localhost:8090/websocket", 8090)

      lifecycle(client).dependsOn(viewServer.server)

      implicit val vsClient = new WebSocketViewServerClient(client, JsonVsSerializer)

      val (instruments, prices, instrumentPrices) = createTables(viewServer)

      val instrumentsProvider = getInstProvider(loadStatic, instruments)
      val pricesProvider = new SimulatedPricesProvider(prices)

      viewServer.registerProvider(instruments, instrumentsProvider)
      viewServer.registerProvider(prices, pricesProvider)

      val runner = new LifeCycleRunner("pricesProvider", () => pricesProvider.runOnce() )

      lifecycle(runner).dependsOn(viewServer)

      lifecycle.start()

      val token = auth("chris", "chris")

      val session = login(token, "chris")

      val result = createVp(session, token, "chris", ViewPortTable("instrumentPrices", "SIMUL"), Array("ric", "description", "bid", "ask", "scenario"), range = ViewPortRange(0, 10))

      Future{
        (1 to 10) foreach { i =>
          Thread.sleep(10000l)
          println("changing viewport range")
          val successVP = result.body.asInstanceOf[CreateViewPortSuccess]
          val changeVpResult = changeVpRange(result.sessionId, result.token, result.user, successVP.viewPortId, ViewPortRange(i * 10, (i * 10) + 10))
        }
      }

      val queueDrainer = new Runner("queueDrainer", () => {
        val updates = awaitMsgBody[TableRowUpdates] match {
          case Some(updates) =>
            println(JsonUtil.toPrettyJson(updates))
          case None =>
            println("problem with deserialization")
        }

      })

      queueDrainer.runInBackground()

      viewServer.httpServer.join()

      println("")

      //      while(true){
      //
      //        val updates = awaitMsgBody[TableRowUpdates]
      //
      //        println(JsonUtil.toPrettyJson(updates))
      //      }
      //
      //      }


    }

//    def tick(prov: MockProvider): Unit = {
//      val delta = ThreadLocalRandom.current().nextInt(-10, 10);
//      val data = Map("ric" -> "VOD.L", "bid" -> (220 + delta), "ask" -> 225)
//      println("Tick" + data)
//      prov.tick("VOD.L", data)
//
//    }

  }

}

