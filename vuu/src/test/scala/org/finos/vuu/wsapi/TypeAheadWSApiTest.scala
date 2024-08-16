package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, TableDef, ViewPortDef}
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.module.typeahead.ViewPortTypeAheadRpcHandler
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net._
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{DisplayResultAction, ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider}

import scala.collection.immutable.ListMap

class TypeAheadWSApiTest extends WebSocketApiTestBase {

  private val tableName = "TypeaheadTest"
  private val tableNameEmpty = "TypeaheadTestEmpty"
  private val moduleName = "TEST"

  Feature("Server web socket api") {
    Scenario("Type ahead request for a column") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for Account column")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, tableName, "Account")
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return top 10 unique values in that column")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]

      response.isDefined shouldBe true
      response.get.method shouldEqual "getUniqueFieldValues"
      assertResponseReturns(response, List("12355", "45321", "89564", "42262", "65879", "88875", "45897", "23564", "33657", "99854"))
    }

    Scenario("Type ahead request that start with a string for a column") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for Name column with start string Tom")
      val getTypeAheadRequest = createTypeAheadStartWithRequest(viewPortId,tableName, "Name", "Tom")
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return all Name values that start with Tom")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]

      response.isDefined shouldBe true
      response.get.method shouldEqual "getUniqueFieldValuesStartingWith"
      assertResponseReturns(response, List("Tom Sawyer", "Tom Thatcher"))
    }

    Scenario("Type ahead request with start with no matching value") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for Name column with start string NoMatching")
      val getTypeAheadRequest = createTypeAheadStartWithRequest(viewPortId, tableName, "Name", "NoMatch")
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return success response with empty list")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]

      response.isDefined shouldBe true
      response.get.method shouldEqual "getUniqueFieldValuesStartingWith"
      assertResponseReturns(response, List.empty)
    }

    Scenario("Type ahead request for a column that is not in view port") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for column that is hidden")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, tableName, "HiddenColumn")
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return success response with empty list")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]

      response.isDefined shouldBe true
      response.get.method shouldEqual "getUniqueFieldValues"
      assertResponseReturns(response, List.empty)
    }

    Scenario("Type ahead request for a column that does not exist") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for column that does not exist")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, tableName, "ColumnThatDoesNotExist")
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return success response with empty list")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]

      response.isDefined shouldBe true
      response.get.method shouldEqual "getUniqueFieldValues"
      assertResponseReturns(response, List.empty)
    }

    Scenario("Type ahead request for a view port that does not exist") {

      When("request typeahead for column that does not exist")
      val getTypeAheadRequest = createTypeAheadRequest("viewPortThatDoesNotExist", tableName, "Account")
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return helpful error response")
      val response = vuuClient.awaitForMsgWithBody[ViewPortMenuRpcReject]

      response.isDefined shouldBe true
      response.get.rpcName shouldEqual "getUniqueFieldValues"
      response.get.error shouldEqual "No viewport viewPortThatDoesNotExist found for RPC Call for getUniqueFieldValues"
    }

    //create multiple view ports
    //check type ahead work on view port columns rather than table columns
    //match response on request id?
    Scenario("Type ahead request for empty table") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for column when table is empty")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, tableNameEmpty, "Account")
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return success response with empty list")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]

      response.isDefined shouldBe true
      response.get.method shouldEqual "getUniqueFieldValues"
      assertResponseReturns(response, List.empty)
    }

    Scenario("Type ahead request when there is multiple viewports and multiple requests") {

      Given("multiple view port exist")
      val viewPortId1: String = createViewPort
      val viewPortId2: String = createViewPort

      When("request typeahead for different view ports")
      val getTypeAheadRequest1 = createTypeAheadStartWithRequest(viewPortId1, tableName, "Name", "S")
      val getTypeAheadRequest2 = createTypeAheadStartWithRequest(viewPortId2, tableName, "Name", "T")
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest1)
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest2)

      Then("return success response for each request")
      val response1 = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]
      val response2 = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]

      response1.isDefined shouldBe true
      response2.isDefined shouldBe true
      assertResponseReturns(response1, List("Sid Sawyer","Sally Phelps"))
      assertResponseReturns(response2, List("Tom Sawyer","Tom Thatcher"))
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
          .addInt("HiddenColumn")
          .build()
    )

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build(),
        service = new ViewPortTypeAheadRpcHandler(tableContainer)
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
    ))
    val providerFactory = (table: DataTable, _: IVuuServer) => new TestProvider(table, dataSource)

    val tableDef2 = TableDef(
      name = tableNameEmpty,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .build()
    )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(tableDef, viewPortDefFactory, providerFactory)
      .addTableForTest(tableDef2)
      .asModule()
  }

  private def createViewPort = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(1, 100), columns = Array("Id", "Name", "Account"))
    vuuClient.send(sessionId, tokenId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    viewPortId
  }

  private def createTypeAheadRequest(viewPortId: String, tableName: String, columnName: String): ViewPortRpcCall = {
    ViewPortRpcCall(
      viewPortId,
      RpcNames.UniqueFieldValuesRpc,
      params = Array(),
      namedParams = Map(
        "table" -> tableName,
        "module" -> moduleName,
        "column" -> columnName
      ))
  }

  private def createTypeAheadStartWithRequest(viewPortId: String, tableName: String, columnName: String, startString: String): ViewPortRpcCall = {
    ViewPortRpcCall(
      viewPortId,
      RpcNames.UniqueFieldValuesStartWithRpc,
      params = Array(),
      namedParams = Map(
        "table" -> tableName,
        "module" -> moduleName,
        "column" -> columnName,
        "starts" -> startString
      ))
  }

  private def assertResponseReturns(response: Option[ViewPortRpcResponse], expectedResult: Any) = {
    val action = response.get.action
    action shouldBe a[DisplayResultAction]
    val displayResultAction = action.asInstanceOf[DisplayResultAction]

    displayResultAction.result shouldEqual expectedResult
  }
}
