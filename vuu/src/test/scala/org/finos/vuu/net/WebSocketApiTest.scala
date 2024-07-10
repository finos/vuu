package org.finos.vuu.net

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.ClientHelperFns
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.module.{TableDefContainer, TestModule}
import org.finos.vuu.core.{VuuClientConnectionOptions, VuuSecurityOptions, VuuServer, VuuServerConfig, VuuThreadingOptions, VuuWebSocketOptions}
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.viewport.ViewPortTable
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.{BeforeAndAfterEach, GivenWhenThen}


class WebSocketApiTest extends AnyFeatureSpec with BeforeAndAfterEach with GivenWhenThen with Matchers {
  implicit var viewServerClient: ViewServerClient = _
  override def beforeEach(): Unit = {
    viewServerClient = testStartUp()
  }
  def testStartUp(): ViewServerClient = {

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

    //set up a dependency on ws server from ws client.
    lifecycle(client).dependsOn(viewServer)

    //lifecycle registration is done in constructor of service classes, so sequence of create is important
    lifecycle.start()

    viewServerClient
  }

  Feature("Server api") {
    Scenario("should get table metadata") {
      Given("a table name")

      val token = ClientHelperFns.auth("testUser", "testUserPassword")
      val session = ClientHelperFns.login(token, "chris")

      //example user helper function
      //ClientHelperFns.tableMetaAsync("someSessionId", "someToken", "testUser", ViewPortTable("GetMeTable", "TestModule"), "requestId1")

      // example without helper
      val getTableMetaRequestMessage = createViewSerMessage(session, token, GetTableMetaRequest(ViewPortTable("instruments", "TEST")))
      viewServerClient.send(getTableMetaRequestMessage)


      val response = ClientHelperFns.awaitMsgBody[GetTableMetaResponse]
      response.isDefined shouldBe true

      val responseMessage =  response.get
      responseMessage.columns.length shouldEqual 5

    }
  }

  def createViewSerMessage(sessionId: String, token: String, body: MessageBody): ViewServerMessage = {
    JsonViewServerMessage(RequestId.oneNew(),
      sessionId,
      token,
      "testUser",
      body,
      "DoesntReallyMatter")
  }

}