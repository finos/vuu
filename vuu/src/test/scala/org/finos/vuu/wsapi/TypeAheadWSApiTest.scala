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
  private val moduleName = "TEST"

  Feature("Server web socket api") {

    Scenario("Type ahead request for a column") {

      Then("create viewport")
      val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(1, 100), columns = Array("Id", "Name", "Account"))
      vuuClient.send(sessionId, tokenId, createViewPortRequest)
      val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
      val viewPortId = viewPortCreateResponse.get.viewPortId

      //todo how to change the table data
      //1. get access to provider and update directly - via adding new function to get provider from TableDefs in TableDefContainer?
      //2. update the data source but have listener function to update the provider if data source change?
      //3. only change when loading table for first time

      val getTypeAheadRequest = ViewPortRpcCall(
        viewPortId,
        RpcNames.UniqueFieldValuesRpc,
        params = Array(),
        namedParams = Map(
          "table" -> tableName,
          "module" -> moduleName,
          "column" -> "Account"
        ))
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return top 10 unique values in that column")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]
      assert(response.isDefined)

      response.get.method shouldEqual "getUniqueFieldValues"

      val action = response.get.action
      action shouldBe a[DisplayResultAction]
      val displayResultAction = action.asInstanceOf[DisplayResultAction]
      displayResultAction.result shouldEqual List("12355", "45321", "89564", "42262", "65879", "88875", "45897", "23564", "33657", "99854")
    }

    Scenario("Type ahead request that start with a string for a column") {

      Then("create viewport")
      val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(1, 100), columns = Array("Id", "Name", "Account"))
      vuuClient.send(sessionId, tokenId, createViewPortRequest)
      val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
      val viewPortId = viewPortCreateResponse.get.viewPortId

      val getTypeAheadRequest = ViewPortRpcCall(
        viewPortId,
        RpcNames.UniqueFieldValuesStartWithRpc,
        params = Array(),
        namedParams = Map(
          "table" -> tableName,
          "module" -> moduleName,
          "column" -> "Name",
          "starts" -> "Tom"
        ))
      vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return top 10 values in that column")
      val response = vuuClient.awaitForMsgWithBody[ViewPortRpcResponse]
      assert(response.isDefined)

      response.get.method shouldEqual "getUniqueFieldValuesStartingWith"

      val action = response.get.action
      action shouldBe a[DisplayResultAction]
      val displayResultAction = action.asInstanceOf[DisplayResultAction]
      displayResultAction.result shouldEqual List("Tom Sawyer", "Tom Thatcher")

    }

    //create multiple view ports
    // check type ahead work on view port columns rather than table columns
    Scenario("Type ahead request for view port that does not exist") {}
    Scenario("Type ahead request for column that does not exist") {}
    Scenario("Type ahead request for empty table") {}
    Scenario("Type ahead request with start with no matching value") {}
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
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 12355),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 45321),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 89564),
      "row4" -> Map("Id" -> "row4", "Name" -> "Tom Thatcher", "Account" -> 12355),
      "row5" -> Map("Id" -> "row5", "Name" -> "Sid Sawyer", "Account" -> 42262),
      "row6" -> Map("Id" -> "row6", "Name" -> "Joe Harper", "Account" -> 65879),
      "row7" -> Map("Id" -> "row7", "Name" -> "Jim Baker", "Account" -> 88875),
      "row8" -> Map("Id" -> "row8", "Name" -> "Amy Lawrence", "Account" -> 45897),
      "row9" -> Map("Id" -> "row9", "Name" -> "Ben Rodgers", "Account" -> 23564),
      "row10" -> Map("Id" -> "row10", "Name" -> "John Murrell", "Account" -> 33657),
      "row11" -> Map("Id" -> "row11", "Name" -> "Sally Phelps", "Account" -> 99854),
      "row12" -> Map("Id" -> "row12", "Name" -> "Polly Phelps", "Account" -> 78458),
      "row13" -> Map("Id" -> "row13", "Name" -> "Polly Phelps", "Account" -> 54874),
    ))
    val providerFactory = (table: DataTable, _: IVuuServer) => new TestProvider(table, dataSource)

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(tableDef, viewPortDefFactory, providerFactory)
      .asModule()
  }
}
