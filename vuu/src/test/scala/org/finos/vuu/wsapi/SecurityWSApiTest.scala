package org.finos.vuu.wsapi

import org.awaitility.Awaitility.await
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.DefaultClock
import org.finos.vuu.api.{ColumnBuilder, Link, TableDef, ViewPortDef, VisualLinks}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.net.{ChangeViewPortRange, ChangeViewPortReject, ChangeViewPortRequest, ChangeViewPortSuccess, CloseTreeNodeReject, CloseTreeNodeRequest, CreateViewPortRequest, CreateViewPortSuccess, CreateVisualLinkRequest, CreateVisualLinkSuccess, DeselectAllReject, DeselectAllRequest, DeselectRowReject, DeselectRowRequest, DisableViewPortReject, DisableViewPortRequest, DisableViewPortSuccess, EnableViewPortReject, EnableViewPortRequest, ErrorResponse, FilterSpec, FreezeViewPortReject, FreezeViewPortRequest, FreezeViewPortSuccess, GetViewPortMenusRequest, GetViewPortVisualLinksRequest, OpenTreeNodeReject, OpenTreeNodeRequest, OpenTreeNodeSuccess, RemoveViewPortReject, RemoveViewPortRequest, RemoveViewPortSuccess, RemoveVisualLinkRequest, RemoveVisualLinkSuccess, RpcReject, RpcUpdate, SelectAllReject, SelectAllRequest, SelectAllSuccess, SelectRowRangeReject, SelectRowRangeRequest, SelectRowReject, SelectRowRequest, SelectRowSuccess, UnfreezeViewPortReject, UnfreezeViewPortRequest, WebSocketViewServerClient}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider, TestVuuClient}

import java.time.Duration
import scala.collection.immutable.ListMap

class SecurityWSApiTest extends WebSocketApiTestBase {

  private val tableName = "accounts"
  private val moduleName = "SecurityWSApiTest"
  private val attacker = VuuUser("31337 H4X0R")
  var attackingLifeCycle: LifecycleContainer = _
  var attackingClient: TestVuuClient = _
  var attackingSessionId: String = _
  var targetViewPortId: String = _

  override def beforeEach(): Unit = {
    attackingLifeCycle = LifecycleContainer()(new DefaultClock)
    attackingClient = createAttackingClient()
    val sessionOption = attackingClient.login(attacker)
    assert(sessionOption.isDefined)
    attackingSessionId = sessionOption.get
    targetViewPortId = createTargetViewPort()
  }

  override def afterEach(): Unit = {
    vuuClient.send(sessionId, RemoveViewPortRequest(targetViewPortId))
    vuuClient.awaitForMsgWithBody[RemoveViewPortSuccess]
    attackingLifeCycle.stop()
  }

  Feature("Assorted security tests") {

    Scenario("Sending messages targeting another users session should result in immediate disconnection") {
      val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(0, 100), Array("*"))

      val requestId = attackingClient.send(sessionId, createViewPortRequest)

      await atMost {
        Duration.ofSeconds(1)
      } until {
        () => !attackingClient.isConnected
      }
    }

    Scenario("Removing another sessions viewport should be rejected") {
      val invalidRequest = RemoveViewPortRequest(targetViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[RemoveViewPortReject]
      response.isEmpty shouldBe false
      response.get.viewPortId shouldEqual targetViewPortId
    }

    Scenario("Enabling another sessions viewport should be rejected") {
      vuuClient.send(sessionId, DisableViewPortRequest(targetViewPortId))
      val disableResponse = vuuClient.awaitForMsgWithBody[DisableViewPortSuccess]

      val invalidRequest = EnableViewPortRequest(targetViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[EnableViewPortReject]
      response.isEmpty shouldBe false
      response.get.viewPortId shouldEqual targetViewPortId
    }

    Scenario("Disabling another sessions viewport should be rejected") {
      val invalidRequest = DisableViewPortRequest(targetViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[DisableViewPortReject]
      response.isEmpty shouldBe false
      response.get.viewPortId shouldEqual targetViewPortId
    }

    Scenario("Freezing another sessions viewport should be rejected") {
      val invalidRequest = FreezeViewPortRequest(targetViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[FreezeViewPortReject]
      response.isEmpty shouldBe false
      response.get.viewPortId shouldEqual targetViewPortId
      response.get.errorMessage shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Unfreezing another sessions viewport should be rejected") {
      vuuClient.send(sessionId, FreezeViewPortRequest(targetViewPortId))
      val freezeResponse = vuuClient.awaitForMsgWithBody[FreezeViewPortSuccess]

      val invalidRequest = UnfreezeViewPortRequest(targetViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[UnfreezeViewPortReject]
      response.isEmpty shouldBe false
      response.get.viewPortId shouldEqual targetViewPortId
      response.get.errorMessage shouldEqual s"Failed to process request $requestId"
    }

    Scenario("RPC Update is disabled") {
      vuuClient.send(sessionId, RpcUpdate(ViewPortTable(tableName, moduleName), "row1", Map("Name" -> "Snoopy")))

      val response = vuuClient.awaitForMsgWithBody[RpcReject]
      response.isEmpty shouldBe false
      response.get.reason shouldEqual "Feature disabled"
    }

    Scenario("Getting VP menus on another sessions viewport should be rejected") {
      val invalidRequest = GetViewPortMenusRequest(targetViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[ErrorResponse]
      response.isEmpty shouldBe false
      response.get.msg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Changing another sessions viewport should be rejected") {
      val invalidRequest = ChangeViewPortRequest(targetViewPortId, Array("*"))
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[ChangeViewPortReject]
      response.isEmpty shouldBe false
      response.get.msg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Changing another sessions viewport range should be rejected") {
      val invalidRequest = ChangeViewPortRange(targetViewPortId, 100, 200)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[ErrorResponse]
      response.isEmpty shouldBe false
      response.get.msg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Selecting in another sessions viewport range should be rejected") {
      val invalidRequest = SelectRowRequest(targetViewPortId, "row1", false)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[SelectRowReject]
      response.isEmpty shouldBe false
      response.get.errorMsg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Deselecting in another sessions viewport range should be rejected") {
      vuuClient.send(sessionId, SelectRowRequest(targetViewPortId, "row1", false))
      val selectResponse = vuuClient.awaitForMsgWithBody[SelectRowSuccess]

      val invalidRequest = DeselectRowRequest(targetViewPortId, "row1", true)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[DeselectRowReject]
      response.isEmpty shouldBe false
      response.get.errorMsg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Selecting a range in another sessions viewport range should be rejected") {
      val invalidRequest = SelectRowRangeRequest(targetViewPortId, "row1", "row5", false)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[SelectRowRangeReject]
      response.isEmpty shouldBe false
      response.get.errorMsg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Selecting all in another sessions viewport should be rejected") {
      val invalidRequest = SelectAllRequest(targetViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[SelectAllReject]
      response.isEmpty shouldBe false
      response.get.errorMsg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Deselecting all in another sessions viewport should be rejected") {
      vuuClient.send(sessionId, SelectAllRequest(targetViewPortId))
      val selectResponse = vuuClient.awaitForMsgWithBody[SelectAllSuccess]

      val invalidRequest = DeselectAllRequest(targetViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[DeselectAllReject]
      response.isEmpty shouldBe false
      response.get.errorMsg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("Getting visual links in another sessions viewport should be rejected") {
      val targetChildViewPortId = createTargetViewPort()
      vuuClient.send(sessionId, CreateVisualLinkRequest(targetChildViewPortId, targetViewPortId, "Name", "Name"))
      vuuClient.awaitForMsgWithBody[CreateVisualLinkSuccess]

      val invalidRequest = GetViewPortVisualLinksRequest(targetChildViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[ErrorResponse]
      response.isEmpty shouldBe false
      response.get.msg shouldEqual s"Failed to process request $requestId"

      //extra cleanup
      vuuClient.send(sessionId, RemoveVisualLinkRequest(targetChildViewPortId))
      vuuClient.awaitForMsgWithBody[RemoveVisualLinkSuccess]
      vuuClient.send(sessionId, RemoveViewPortRequest(targetChildViewPortId))
      vuuClient.awaitForMsgWithBody[RemoveViewPortSuccess]
    }

    Scenario("Adding a visual link in another sessions viewport should be rejected") {
      val targetChildViewPortId = createTargetViewPort()

      val invalidRequest = CreateVisualLinkRequest(targetChildViewPortId, targetViewPortId, "Name", "Name")
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[ErrorResponse]
      response.isEmpty shouldBe false
      response.get.msg shouldEqual s"Failed to process request $requestId"
      vuuClient.send(sessionId, RemoveViewPortRequest(targetChildViewPortId))
      vuuClient.awaitForMsgWithBody[RemoveViewPortSuccess]
    }

    Scenario("Removing a visual link in another sessions viewport should be rejected") {
      val targetChildViewPortId = createTargetViewPort()
      vuuClient.send(sessionId, CreateVisualLinkRequest(targetChildViewPortId, targetViewPortId, "Name", "Name"))
      vuuClient.awaitForMsgWithBody[CreateVisualLinkSuccess]

      val invalidRequest = RemoveVisualLinkRequest(targetChildViewPortId)
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[ErrorResponse]
      response.isEmpty shouldBe false
      response.get.msg shouldEqual s"Failed to process request $requestId"

      //extra cleanup
      vuuClient.send(sessionId, RemoveVisualLinkRequest(targetChildViewPortId))
      vuuClient.awaitForMsgWithBody[RemoveVisualLinkSuccess]
      vuuClient.send(sessionId, RemoveViewPortRequest(targetChildViewPortId))
      vuuClient.awaitForMsgWithBody[RemoveViewPortSuccess]
    }

    Scenario("Opening a node in another sessions viewport should be rejected") {
      vuuClient.send(sessionId, ChangeViewPortRequest(viewPortId = targetViewPortId, columns = Array("*"),
        filterSpec = FilterSpec(""), groupBy = Array("Name")))
      vuuClient.awaitForMsgWithBody[ChangeViewPortSuccess]
      waitForData(28)

      val invalidRequest = OpenTreeNodeRequest(targetViewPortId, "$root|Polly Phelps")
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[OpenTreeNodeReject]
      response.isEmpty shouldBe false
    }

    Scenario("Closing a node in another sessions viewport should be rejected") {
      vuuClient.send(sessionId, ChangeViewPortRequest(viewPortId = targetViewPortId, columns = Array("*"),
        filterSpec = FilterSpec(""), groupBy = Array("Name")))
      vuuClient.awaitForMsgWithBody[ChangeViewPortSuccess]
      waitForData(28)
      vuuClient.send(sessionId, OpenTreeNodeRequest(targetViewPortId, "$root|Polly Phelps"))
      vuuClient.awaitForMsgWithBody[OpenTreeNodeSuccess]
      waitForData(5)

      val invalidRequest = CloseTreeNodeRequest(targetViewPortId, "$root|Polly Phelps")
      val requestId = attackingClient.send(attackingSessionId, invalidRequest)

      val response = attackingClient.awaitForMsgWithBody[CloseTreeNodeReject]
      response.isEmpty shouldBe false
    }

  }

  private def createTargetViewPort(): String = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(0, 100), Array("*"))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(15)
    viewPortId
  }

  private def createAttackingClient(): TestVuuClient = {
    val uri = s"ws://localhost:${vuuServerConfig.wsOptions.wsPort}/${vuuServerConfig.wsOptions.uri}"
    val port = vuuServerConfig.wsOptions.wsPort
    val attackingWebSocketClient = new WebSocketClient(uri, port)(attackingLifeCycle)
    val attackingViewServerClient = new WebSocketViewServerClient(attackingWebSocketClient, JsonVsSerializer())(attackingLifeCycle)
    val attackingVuuClient: TestVuuClient = new TestVuuClient(attackingViewServerClient, vuuServerConfig.security.loginTokenService)
    attackingLifeCycle.start()
    await atMost {
      Duration.ofSeconds(1)
    } until {
      () => attackingVuuClient.isConnected
    }
    attackingVuuClient
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val tableDef = TableDef(
      name = tableName,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .addInt("HiddenColumn")
          .build(),
      links = VisualLinks(Link("Name", tableName, "Name"))
    )

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build(),
        service = new DefaultRpcHandler()(tableContainer)
      )

    val dataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 12355, "HiddenColumn" -> 10),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 45321, "HiddenColumn" -> 10),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 89564, "HiddenColumn" -> 11),
      "row4" -> Map("Id" -> "row4", "Name" -> "Tom Thatcher", "Account" -> 12355, "HiddenColumn" -> 10),
      "row5" -> Map("Id" -> "row5", "Name" -> "Sid Sawyer", "Account" -> 42262, "HiddenColumn" -> 10),
      "row6" -> Map("Id" -> "row6", "Name" -> "Joe Harper", "Account" -> 65879, "HiddenColumn" -> 10),
      "row7" -> Map("Id" -> "row7", "Name" -> "Jim Baker", "Account" -> 88875, "HiddenColumn" -> 10),
      "row8" -> Map("Id" -> "row8", "Name" -> "Amy Lawrence", "Account" -> 45897, "HiddenColumn" -> 15),
      "row9" -> Map("Id" -> "row9", "Name" -> "Ben Rodgers", "Account" -> 23564, "HiddenColumn" -> 10),
      "row10" -> Map("Id" -> "row10", "Name" -> "John Murrell", "Account" -> 33657, "HiddenColumn" -> 10),
      "row11" -> Map("Id" -> "row11", "Name" -> "Sally Phelps", "Account" -> 99854, "HiddenColumn" -> 10),
      "row12" -> Map("Id" -> "row12", "Name" -> "Polly Phelps", "Account" -> 78458, "HiddenColumn" -> 10),
      "row13" -> Map("Id" -> "row13", "Name" -> "Polly Phelps", "Account" -> 54874, "HiddenColumn" -> 10),
      "row14" -> Map("Id" -> "row14", "Name" -> "Johnny Cash", "Account" -> 54875, "HiddenColumn" -> 10),
      "row15" -> Map("Id" -> "row15", "Name" -> "Tom DeLay", "Account" -> 54876, "HiddenColumn" -> 10),
    ))
    
    val providerFactory = (table: DataTable, _: AbstractVuuServer) => new TestProvider(table, dataSource)

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(tableDef, viewPortDefFactory, providerFactory)
      .asModule()
  }

}
