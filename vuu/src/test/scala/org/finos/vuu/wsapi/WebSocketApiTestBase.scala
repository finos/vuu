package org.finos.vuu.wsapi

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core._
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.net._
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.wsapi.helpers.TestVuuClient
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.{BeforeAndAfterAll, GivenWhenThen}

abstract class WebSocketApiTestBase extends AnyFeatureSpec with BeforeAndAfterAll with GivenWhenThen with Matchers {

  implicit val timeProvider: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val tableDefContainer: TableDefContainer = new TableDefContainer
  var viewServerClient: ViewServerClient = _
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
    lifecycle.stop()
  }

  def testStartUp(): TestVuuClient = {

    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    lifecycle.autoShutdownHook()

    val rand = new scala.util.Random
    val http = rand.between(10011, 10500)
    val ws = rand.between(10011, 10500)

    val module: ViewServerModule = defineModuleWithTestTables()

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
    )
      .withModule(module)

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

  protected def defineModuleWithTestTables(): ViewServerModule

}

