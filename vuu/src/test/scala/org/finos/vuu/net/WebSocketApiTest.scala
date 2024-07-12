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
import org.scalatest.{BeforeAndAfterAll, GivenWhenThen}

import scala.reflect.ClassTag


class WebSocketApiTest extends AnyFeatureSpec with BeforeAndAfterAll with GivenWhenThen with Matchers {
  implicit var viewServerClient: ViewServerClient = _

  override def beforeAll(): Unit = {
    viewServerClient = testStartUp()
  }

  override def afterAll(): Unit = {
    //todo cleanup
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

  Feature("Server web socket api") {
    Scenario("client requests to get table metadata for a table") {
      val token = ClientHelperFns.auth("testUser", "testUserPassword")
      val session = ClientHelperFns.login(token, "testUser")

      //example user helper function
      //ClientHelperFns.tableMetaAsync("someSessionId", "someToken", "testUser", ViewPortTable("GetMeTable", "TestModule"), "requestId1")

      // example without helper
      val getTableMetaRequestMessage = createViewSerMessage(session, token, GetTableMetaRequest(ViewPortTable("instruments", "TEST")))
      viewServerClient.send(getTableMetaRequestMessage)

      Then("return table data in response")
      val response = ClientHelperFns.awaitMsgBody[GetTableMetaResponse]
      response.isDefined shouldBe true

      val responseMessage = response.get
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

  Scenario("client requests to get table metadata for a non existent") {

    val client = new MyWebSocketClient(viewServerClient)

    val (token, sessionId) = client.authenticateAndLogin("testUser", "testUserPassword")

    client.send(sessionId, token, GetTableMetaRequest(ViewPortTable("DoesNotExist", "TEST")))

    Then("return error response with helpful message")
    val response = client.awaitForMsgWithBody[ErrorResponse]
    response.isDefined shouldBe true

    val responseMessage = response.get
    responseMessage.msg shouldEqual "No such table found with name DoesNotExist in module TEST"
  }

  Scenario("client requests to get table metadata for null table name") {

    val client = new MyWebSocketClient(viewServerClient)

    val (token, sessionId) = client.authenticateAndLogin("testUser", "testUserPassword")

    client.send(sessionId, token, GetTableMetaRequest(ViewPortTable(null, "TEST")))


    Then("return error response with helpful message")
    val response = client.awaitForMsgWithBody[ErrorResponse]
    response.isDefined shouldBe true

    val responseMessage = response.get
    responseMessage.msg shouldEqual "No such table found with name DoesNotExist in module TEST"

  }

}

class MyWebSocketClient(vsClient: ViewServerClient) {

  type SessionId = String
  type Token = String

  def send(sessionId: String, token: String, body: MessageBody): Unit = {
    vsClient.send(createViewServerMessage(sessionId, token, body))
  }

  //todo fold this in to WebSocketViewServerClient?
  //is intention that this can be used for non ws client?
  def awaitForMsgWithBody[T <: AnyRef](implicit t: ClassTag[T]): Option[T] = {
    val msg = vsClient.awaitMsg
    if (msg != null) { //null indicate error or timeout
      if (isExpectedBodyType(t, msg))
        Some(msg.body.asInstanceOf[T])
      else
        awaitForMsgWithBody
    }
    else
      None
  }

  def authenticateAndLogin(user: String, password: String): (Token, SessionId) = {
    val token = authenticate(user, password)
    val session = login(token, user)
    (token, session)
  }

  private def isExpectedBodyType[T <: AnyRef](t: ClassTag[T], msg: ViewServerMessage) = {
    val expectedBodyType: Class[T] = t.runtimeClass.asInstanceOf[Class[T]]
    expectedBodyType.isAssignableFrom(msg.body.getClass)
  }

  private def createViewServerMessage(sessionId: String, token: String, body: MessageBody): ViewServerMessage = {
    JsonViewServerMessage(RequestId.oneNew(),
      sessionId,
      token,
      "testUser",
      body,
      "DoesntReallyMatter")
  }

  //todo not used
  def authenticate(user: String, password: String): String = {
    send("not used", "not used", AuthenticateRequest(user, password))
    awaitForMsgWithBody[AuthenticateSuccess].get.token //todo handle no response
  }

  def login(token: String, user: String): String = {
    send("not used", "not used", LoginRequest(token, user))
    vsClient.awaitMsg.sessionId //todo handle no response
    //todo what to do if LoginFailure - is this expected to return token when failed?
    //Should token be called session?
  }
}