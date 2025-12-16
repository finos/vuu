package org.finos.vuu.wsapi

import org.finos.vuu.api.*
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{Columns, DataTable, TableContainer}
import org.finos.vuu.net.*
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcNames}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider}

import scala.collection.immutable.ListMap

class TypeAheadWSApiTest extends WebSocketApiTestBase {

  private val tableName = "TypeaheadTest"
  private val tableNameEmpty = "TypeaheadTestEmpty"
  private val baseTableName = "TypeaheadTestBase"
  private val rightTableName = "TypeaheadTestRight"
  private val joinTableName = "TypeaheadTestJoin"
  private val moduleName = "TEST"

  Feature("[Web Socket API] Type ahead request") {
    Scenario("For a column") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for Account column")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, tableName, "Account")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return top 10 unique values in that column")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValues"

      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("23564", "33657", "42262", "45321", "45897", "54874", "54875", "54876", "65879", "78458")

      And("return No Action")
      responseBody.action shouldBe a[NoneAction]
    }

    Scenario("Start with a specified string for a column") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for Name column with start string Tom")
      val getTypeAheadRequest = createTypeAheadStartWithRequest(viewPortId, tableName, "Name", "Tom")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return all Name values that start with Tom")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValuesStartingWith"
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("Tom Sawyer", "Tom DeLay")
    }

    Scenario("Start with a specified string that has no matching value") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for Name column with start string NoMatching")
      val getTypeAheadRequest = createTypeAheadStartWithRequest(viewPortId, tableName, "Name", "NoMatch")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return success response with empty list")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValuesStartingWith"
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List.empty
    }

    Scenario("For a column that is not in view port") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for column that is hidden")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, tableName, "HiddenColumn")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return success response with empty list")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValues"
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List.empty
    }

    Scenario("For a column that does not exist") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for column that does not exist")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, tableName, "ColumnThatDoesNotExist")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return success response with empty list")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValues"
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List.empty
    }

    Scenario("For a viewport that does not exist") {

      When("request typeahead for Account column")
      val getTypeAheadRequest = createTypeAheadRequest("viewPortThatDoesNotExist", tableName, "Account")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return helpful error response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValues"

      val result = assertAndCastAsInstanceOf[RpcErrorResult](responseBody.result)
      result.errorMessage shouldEqual s"Failed to process request $requestId"

      And("Show error notification action")
      val action = assertAndCastAsInstanceOf[ShowNotificationAction](responseBody.action)
      action.notificationType shouldEqual "Error"
      action.title shouldEqual "Failed to process getUniqueFieldValues request"
      action.message shouldEqual s"Failed to process request $requestId"
    }

    Scenario("For an empty table") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for column when table is empty")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, tableNameEmpty, "Account")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return success response with empty list")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValues"
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List.empty
    }

    Scenario("When there is multiple viewports and multiple requests") {

      Given("multiple view port exist")
      val viewPortId1: String = createViewPort
      val viewPortId2: String = createViewPort

      When("request typeahead for different view ports")
      val getTypeAheadRequest1 = createTypeAheadStartWithRequest(viewPortId1, tableName, "Name", "S")
      val getTypeAheadRequest2 = createTypeAheadStartWithRequest(viewPortId2, tableName, "Name", "T")
      val requestId1 = vuuClient.send(sessionId, getTypeAheadRequest1)
      val requestId2 = vuuClient.send(sessionId, getTypeAheadRequest2)

      Then("return success response for each request")
      val response1 = vuuClient.awaitForResponse(requestId1)
      val responseBody1 = assertBodyIsInstanceOf[RpcResponseNew](response1)
      val result1 = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody1.result)

      val response2 = vuuClient.awaitForResponse(requestId2)
      val responseBody2 = assertBodyIsInstanceOf[RpcResponseNew](response2)
      val result2 = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody2.result)

      result1.data shouldEqual List("Sid Sawyer", "Sally Phelps")
      result2.data shouldEqual List("Tom Sawyer", "Tom DeLay")
    }

    Scenario("For a column in a join table") {

      Given("a view port exist")
      val viewPortId: String = createViewPortForJoinTable

      When("request typeahead for Account column in join table")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, joinTableName, "Account")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return top 10 unique values in that column")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValues"

      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("23564", "33657", "42262", "45321", "45897", "54874", "54875", "54876", "65879", "78458")

      And("return No Action")
      responseBody.action shouldBe a[NoneAction]
    }

    Scenario("Start with a specified string for a column in a join table") {

      Given("a view port exist")
      val viewPortId: String = createViewPortForJoinTable

      When("request typeahead for Name column in join table with start string Tom")
      val getTypeAheadRequest = createTypeAheadStartWithRequest(viewPortId, tableName, "Name", "Tom")
      val requestId = vuuClient.send(sessionId, getTypeAheadRequest)

      Then("return all Name values that start with Tom")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValuesStartingWith"
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("Tom Sawyer", "Tom DeLay")
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

    val tableDefEmpty = TableDef(
      name = tableNameEmpty,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .build()
    )

    val baseTableDef = TableDef(
      name = baseTableName,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .addInt("HiddenColumn")
          .build(),
      VisualLinks(),
      joinFields = "Id"
    )
    val baseProviderFactory = (table: DataTable, _: AbstractVuuServer) => new TestProvider(table, dataSource)

    val rightTableDef = TableDef(
      name = rightTableName,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Description")
          .build(),
      VisualLinks(),
      joinFields = "Id"
    )

    val rightDataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Description" -> "This is row1"),
      "row2" -> Map("Id" -> "row2", "Description" -> "This is row2"),
      "row3" -> Map("Id" -> "row3", "Description" -> "This is row3"),
      "row4" -> Map("Id" -> "row4", "Description" -> "This is row4"),
      "row5" -> Map("Id" -> "row5", "Description" -> "This is row5"),
      "row6" -> Map("Id" -> "row6", "Description" -> "This is row6"),
      "row7" -> Map("Id" -> "row7", "Description" -> "This is row7"),
      "row8" -> Map("Id" -> "row8", "Description" -> "This is row8"),
      "row9" -> Map("Id" -> "row9", "Description" -> "This is row9"),
      "row10" -> Map("Id" -> "row10", "Description" -> "This is row10"),
      "row11" -> Map("Id" -> "row11", "Description" -> "This is row11"),
      "row12" -> Map("Id" -> "row12", "Description" -> "This is row12"),
      "row13" -> Map("Id" -> "row13", "Description" -> "This is row13"),
      "row14" -> Map("Id" -> "row14", "Description" -> "This is row14"),
      "row15" -> Map("Id" -> "row15", "Description" -> "This is row15"),
    ))
    val rightProviderFactory = (table: DataTable, _: AbstractVuuServer) => new TestProvider(table, rightDataSource)

    val joinTableFunc: TableDefContainer => JoinTableDef = _ => JoinTableDef(
      name = joinTableName,
      baseTable = baseTableDef,
      joinColumns = Columns.allFrom(baseTableDef),
      joins =
        JoinTo(
          table = rightTableDef,
          joinSpec = JoinSpec(left = "Id", right = "Id", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq()
    )
    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(tableDef, viewPortDefFactory, providerFactory)
      .addTableForTest(tableDefEmpty)
      .addTableForTest(baseTableDef, baseProviderFactory)
      .addTableForTest(rightTableDef, rightProviderFactory)
      .addJoinTableForTest(joinTableFunc)
      .asModule()
  }

  private def createViewPortForJoinTable = {
    createViewPortBase(joinTableName, 12)
  }

  private def createViewPort = {
    createViewPortBase(tableName, 12)
  }

  private def createViewPortBase(tableName: String, expectedRowCount: Int) = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName),
      ViewPortRange(1, 100), columns = Array("Id", "Name", "Account"),
      SortSpec(List(SortDef("Account", 'A'))), Array.empty[String], FilterSpec("Account > 20000"))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(expectedRowCount)
    viewPortId
  }

  private def createTypeAheadRequest(viewPortId: String, tableName: String, columnName: String): RpcRequest = {
    RpcRequest(
      ViewPortContext(viewPortId),
      RpcNames.UniqueFieldValuesRpc,
      params = Map(
        "table" -> tableName,
        "module" -> moduleName,
        "column" -> columnName
      ))
  }

  private def createTypeAheadStartWithRequest(viewPortId: String, tableName: String, columnName: String, startString: String): RpcRequest = {
    RpcRequest(
      ViewPortContext(viewPortId),
      RpcNames.UniqueFieldValuesStartWithRpc,
      params = Map(
        "table" -> tableName,
        "module" -> moduleName,
        "column" -> columnName,
        "starts" -> startString
      ))
  }
}