package org.finos.vuu.net

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.{ColumnBuilder, TableDef, ViewPortDef}
import org.finos.vuu.core._
import org.finos.vuu.core.module.typeahead.ViewPortTypeAheadRpcHandler
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.TestExtension.ModuleFactoryExtension
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{DisplayResultAction, ViewPortRange, ViewPortTable}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.{BeforeAndAfterAll, GivenWhenThen}

class WebSocketApiTest extends AnyFeatureSpec with BeforeAndAfterAll with GivenWhenThen with Matchers {

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

    val http = 10011
    val ws = 10013

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

  private def defineModuleWithTestTables(): ViewServerModule = {
    val tableDef = TableDef(
      name = "TableMetaTest",
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .build()
    )

    val viewPortDefFactory = (table: DataTable, provider: Provider, providerContainer: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addInt("Account")
          .build(),
      service = new ViewPortTypeAheadRpcHandler(tableContainer)
    )

    val dataSource  = new FakeDataSource(Map(
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 1235),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 45321),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 89564),
    ))

    val providerFactory = (table: DataTable, vuuServer: IVuuServer) => new TestProvider(table, dataSource)
    val tableDef2 = TableDef(
      name = "TableMetaDefaultVPTest",
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .build()
    )

    ModuleFactory.withNamespace("TEST")
      .addTableForTest(tableDef, viewPortDefFactory, providerFactory)
      .addTableForTest(tableDef2)
      .asModule()
  }

  Feature("Server web socket api") {
    Scenario("client requests to get table metadata for a table") {

      vuuClient.send(sessionId, tokenId, GetTableMetaRequest(ViewPortTable("TableMetaTest", "TEST")))

      Then("return view port columns in response")
      val response = vuuClient.awaitForMsgWithBody[GetTableMetaResponse]
      assert(response.isDefined)

      val responseMessage = response.get
      responseMessage.columns.length shouldEqual 2
      responseMessage.columns shouldEqual Array("Id", "Account")
    }

    Scenario("client requests to get table metadata for a table with no view port def defined") {

      vuuClient.send(sessionId, tokenId, GetTableMetaRequest(ViewPortTable("TableMetaDefaultVPTest", "TEST")))

      Then("return table columns as default view port columns in response")
      val response = vuuClient.awaitForMsgWithBody[GetTableMetaResponse]
      assert(response.isDefined)

      val responseMessage = response.get
      responseMessage.columns.length shouldEqual 1
      responseMessage.columns shouldEqual Array("Id")
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

    Scenario("Type ahead rcp request for a column") {

      Then("create viewport")
      val createViewPortRequest = CreateViewPortRequest(ViewPortTable("TableMetaTest", "TEST"), ViewPortRange(1,100),columns = Array("Id", "Name", "Account"))
      vuuClient.send(sessionId, tokenId, createViewPortRequest)
      val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
      val viewPortId = viewPortCreateResponse.get.viewPortId

      //todo how to change the table data
      //1. get access to provider and update directly - via adding new function to get provider from TableDefs in TableDefContainer?
      //2. update the data source but have listener function to update the provider if data source change?
      //3. only change when loading table for first time

      val getTypeAheadRequest = ViewPortRpcCall(
        viewPortId,
        "getUniqueFieldValues",
        params = Array(),
        namedParams = Map(
          "table" -> "TableMetaTest",
          "module" -> "TEST",
          "column" -> "Account"
        ))
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return top 10 values in that column")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]
      assert(response.isDefined)

      response.get.method shouldEqual "getUniqueFieldValues"

      val action = response.get.action
      action shouldBe a [DisplayResultAction]
      val displayResultAction = action.asInstanceOf[DisplayResultAction]
      displayResultAction.result shouldEqual List("1235", "45321", "89564")

    }
  }
}

