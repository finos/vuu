package org.finos.vuu.wsapi

import org.finos.vuu.api._
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.core.table.DefaultColumnNames.CreatedTimeColumnName
import org.finos.vuu.net._
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider}

import scala.collection.immutable.ListMap

class FreezeViewPortWSApiTest extends WebSocketApiTestBase {
  private val tableName = "FreezingVPTest"
  private val moduleName = "FreezingVPTEST"
  private val fakeViewPortId = "fakeId"

  Feature("[Web Socket API] Freeze view port request") {
    Scenario("Freeze a view port") {
      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request freezing view port")
      val freezeVPRequest = FreezeViewPortRequest(viewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, freezeVPRequest)

      Then("view port is frozen")
      val freezeVPResponse = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[FreezeViewPortSuccess](freezeVPResponse)
      responseBody.viewPortId shouldEqual viewPortId
    }

    Scenario("Unfreeze a view port") {
      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request freezing view port")
      val freezeVPRequest = FreezeViewPortRequest(viewPortId)
      val freezeRequestId = vuuClient.send(sessionId, tokenId, freezeVPRequest)

      Then("view port is frozen")
      val freezeVPResponse = vuuClient.awaitForResponse(freezeRequestId)
      val freezeResponseBody = assertBodyIsInstanceOf[FreezeViewPortSuccess](freezeVPResponse)
      freezeResponseBody.viewPortId shouldEqual viewPortId

      When("request unfreezing view port")
      val unfreezeVPRequest = UnfreezeViewPortRequest(viewPortId)
      val unfreezeRrequestId = vuuClient.send(sessionId, tokenId, unfreezeVPRequest)

      Then("view port is unfrozen")
      val unfreezeResponse = vuuClient.awaitForResponse(unfreezeRrequestId)
      val unfreezeResponseBody = assertBodyIsInstanceOf[UnfreezeViewPortSuccess](unfreezeResponse)
      unfreezeResponseBody.viewPortId shouldEqual viewPortId
    }

    Scenario("Freeze a view port that doesn't exist") {
      When("request freezing view port")
      val request = FreezeViewPortRequest(fakeViewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, request)

      Then("return failure response")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[FreezeViewPortReject](response)
      responseBody.viewPortId shouldEqual fakeViewPortId
      responseBody.errorMessage shouldEqual s"java.lang.Exception: Could not find viewport to freeze $fakeViewPortId"
    }

    Scenario("Unfreeze a view port that doesn't exist") {
      When("request unfreezing view port")
      val request = UnfreezeViewPortRequest(fakeViewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, request)

      Then("return failure response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[UnfreezeViewPortReject](response)
      responseBody.viewPortId shouldEqual fakeViewPortId
      responseBody.errorMessage shouldEqual s"java.lang.Exception: Could not find viewport to unfreeze $fakeViewPortId"
    }

    Scenario("Freeze a view port that is already frozen") {
      Given("a view port exists")
      val viewPortId: String = createViewPort

      When("request freezing view port")
      val freezeVPRequest1 = FreezeViewPortRequest(viewPortId)
      val requestId1 = vuuClient.send(sessionId, tokenId, freezeVPRequest1)

      Then("view port is frozen")
      val freezeVPResponse = vuuClient.awaitForResponse(requestId1)
      val responseBody = assertBodyIsInstanceOf[FreezeViewPortSuccess](freezeVPResponse)
      responseBody.viewPortId shouldEqual viewPortId

      When("request freezing view port again")
      val freezeVPRequest2 = FreezeViewPortRequest(viewPortId)
      val requestId2 = vuuClient.send(sessionId, tokenId, freezeVPRequest2)

      Then("return failure response")
      val response2 = vuuClient.awaitForResponse(requestId2)
      val responseBody2 = assertBodyIsInstanceOf[FreezeViewPortReject](response2)
      responseBody2.viewPortId shouldEqual viewPortId
      responseBody2.errorMessage shouldEqual s"java.lang.Exception: Could not freeze viewport $viewPortId because it's already frozen"
    }

    Scenario("Unfreeze a view port that is not frozen") {
      Given("a view port exists")
      val viewPortId: String = createViewPort

      When("request unfreezing view port")
      val unfreezeVPRequest = UnfreezeViewPortRequest(viewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, unfreezeVPRequest)

      Then("return failure response")
      val unfreezeVPResponse = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[UnfreezeViewPortReject](unfreezeVPResponse)
      responseBody.viewPortId shouldEqual viewPortId
      responseBody.errorMessage shouldEqual s"java.lang.Exception: Could not unfreeze viewport $viewPortId because it's not frozen"
    }
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
          .build()
    )

    val lastHour: Long = timeProvider.now() - 3600000
    val nextHour: Long = timeProvider.now() + 3600000

    val dataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 123, CreatedTimeColumnName -> lastHour),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 456, CreatedTimeColumnName -> lastHour),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 789, CreatedTimeColumnName -> nextHour),
    ))
    val providerFactory = (table: DataTable, _: IVuuServer) => new TestProvider(table, dataSource)

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(tableDef, providerFactory)
      .asModule()
  }

  private def createViewPort = {
    createViewPortBase(tableName)
  }

  private def createViewPortBase(tableName: String) = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(1, 100), columns = Array("Id", "Name", "Account"))
    vuuClient.send(sessionId, tokenId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    // Verify viewport keys are populated. viewPortRunner cycle is 100ms
    val tableSizeResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
    tableSizeResponse.get.rows(0).vpSize shouldEqual 3
    viewPortId
  }
}