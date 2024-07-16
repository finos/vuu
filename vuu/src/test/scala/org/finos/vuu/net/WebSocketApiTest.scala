package org.finos.vuu.net

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core._
import org.finos.vuu.core.module.{TableDefContainer, TestModule}
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.viewport.ViewPortTable
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.{BeforeAndAfterAll, GivenWhenThen}

class WebSocketApiTest extends AnyFeatureSpec with BeforeAndAfterAll with GivenWhenThen with Matchers {
  implicit var viewServerClient: ViewServerClient = _
  var vuuClient: TestVuuClient = _
  var tokenId: String = _
  var sessionId: String = _

  override def beforeAll(): Unit = {
    vuuClient = testStartUp()

    tokenId = vuuClient.createAuthToken()
    val sessionOption = vuuClient.login(tokenId, "testUser")
    assert(sessionOption.isDefined)
    sessionId = sessionOption.get
  }

  override def afterAll(): Unit = {
    //todo cleanup
  }

  def testStartUp(): TestVuuClient = {

    implicit val timeProvider: Clock = new DefaultClock
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer
    implicit val metrics: MetricsProvider = new MetricsProviderImpl
    implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

    lifecycle.autoShutdownHook()

    val http = 10011
    val ws = 10013

    val config = VuuServerConfig(
      VuuHttp2ServerOptions()
        .withWebRoot("vuu/src/main/resources/www")
        .withSslDisabled()
        .withDirectoryListings(true)
        .withPort(http),
      VuuWebSocketOptions()
        .withBindAddress("0.0.0.0")
        .withUri("websocket")
        .withWsPort(ws)
        .withWssDisabled(),
      VuuSecurityOptions()
        .withAuthenticator(new AlwaysHappyAuthenticator)
        .withLoginValidator(new AlwaysHappyLoginValidator),
      VuuThreadingOptions(),
      VuuClientConnectionOptions()
        .withHeartbeatDisabled()
    ).withModule(TestModule())

    val viewServer = new VuuServer(config)

    val client = new WebSocketClient(s"ws://localhost:$ws/websocket", ws) //todo review params - port specified twice
    val viewServerClient: ViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer)
    val vuuClient = new TestVuuClient(viewServerClient)

    //set up a dependency on ws server from ws client.
    lifecycle(client).dependsOn(viewServer)

    //lifecycle registration is done in constructor of service classes, so sequence of create is important
    lifecycle.start()

    vuuClient
  }

  Feature("Server web socket api") {
    Scenario("client requests to get table metadata for a table") {

      vuuClient.send(sessionId, tokenId, GetTableMetaRequest(ViewPortTable("instruments", "TEST")))

      Then("return table data in response")
      val response = vuuClient.awaitForMsgWithBody[GetTableMetaResponse]
      assert(response.isDefined)

      val responseMessage = response.get
      responseMessage.columns.length shouldEqual 5
    }

    Scenario("client requests to get table metadata for a non existent") {

      vuuClient.send(sessionId, tokenId, GetTableMetaRequest(ViewPortTable("DoesNotExist", "TEST")))

      Then("return error response with helpful message")
      val response = vuuClient.awaitForMsgWithBody[ErrorResponse]
      assert(response.isDefined)
      response.get.msg shouldEqual "No such table found with name DoesNotExist in module TEST"
    }

    Scenario("client requests to get table metadata for null table name") {

      vuuClient.send(sessionId, tokenId, GetTableMetaRequest(ViewPortTable(null, "TEST")))

      Then("return error response with helpful message")
      val response = vuuClient.awaitForMsgWithBody[ErrorResponse]
      assert(response.isDefined)
      response.get.msg shouldEqual "No such table found with name null in module TEST. Table name and module should not be null"
    }
  }
}

