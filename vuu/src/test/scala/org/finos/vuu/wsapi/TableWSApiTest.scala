package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, TableDef, ViewPortDef}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, DefaultColumn, TableContainer}
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.net.{ChangeViewPortRange, ChangeViewPortRangeSuccess, CreateViewPortRequest, CreateViewPortSuccess, ErrorResponse, GetTableMetaRequest, GetTableMetaResponse, SelectRowRequest, SelectRowSuccess}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider}

import scala.collection.immutable.ListMap

class TableWSApiTest extends WebSocketApiTestBase {

  private val moduleName = "TableWSApiTest"

  Feature("[Web Socket API] Get table metadata") {
    Scenario("For a table") {

      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable("users", moduleName)))

      Then("return view port columns in response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[GetTableMetaResponse](response)
      responseBody.columns.length shouldEqual 2
      responseBody.columns shouldEqual Array("id", "account")
    }

    Scenario("For a table with no view port def defined") {

      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable("default", moduleName)))

      Then("return table columns as default view port columns in response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[GetTableMetaResponse](response)
      responseBody.columns.length shouldEqual 3
      responseBody.columns should contain theSameElementsAs (Array("id") ++ DefaultColumn.values.map(_.name))
    }

    Scenario("For a non existent table") {

      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable("DoesNotExist", moduleName)))

      Then("return error response with helpful message")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[ErrorResponse](response)
      responseBody.msg shouldEqual s"Failed to process request $requestId"
    }

    Scenario("For null table name") {

      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable(null, moduleName)))

      Then("return error response with helpful message")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[ErrorResponse](response)
      responseBody.msg shouldEqual s"Failed to process request $requestId"
    }
  }

  Feature("[Web Socket API] Set range") {

    Scenario("Scroll around and select rows") {

      val viewPortId = createViewPort("users")

      //scroll to end
      val rangeRequest = ChangeViewPortRange(viewPortId, 5, 15)
      vuuClient.send(sessionId, rangeRequest)
      vuuClient.awaitForMsgWithBody[ChangeViewPortRangeSuccess]
      waitForData(5)

      //select last row by key
      val selectRowRequest = SelectRowRequest(viewPortId, "row15", false)
      vuuClient.send(sessionId, selectRowRequest)
      vuuClient.awaitForMsgWithBody[SelectRowSuccess]

      //select first row in range by key
      val selectRowRequest2 = SelectRowRequest(viewPortId, "row6", false)
      vuuClient.send(sessionId, selectRowRequest2)
      vuuClient.awaitForMsgWithBody[SelectRowSuccess]

      //scroll to beginning
      val rangeRequest2 = ChangeViewPortRange(viewPortId, 0, 10)
      vuuClient.send(sessionId, rangeRequest2)
      vuuClient.awaitForMsgWithBody[ChangeViewPortRangeSuccess]
      waitForData(5)

      //select last row of range by key
      val selectRowRequest3 = SelectRowRequest(viewPortId, "row10", false)
      vuuClient.send(sessionId, selectRowRequest3)
      vuuClient.awaitForMsgWithBody[SelectRowSuccess]

      //select first row by key
      val selectRowRequest4 = SelectRowRequest(viewPortId, "row1", false)
      vuuClient.send(sessionId, selectRowRequest4)
      vuuClient.awaitForMsgWithBody[SelectRowSuccess]

    }

  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val tableDef = TableDef(
      name = "users",
      keyField = "id",
      columns =
        new ColumnBuilder()
          .addString("id")
          .addString("name")
          .addInt("account")
          .build()
    )

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns =
          new ColumnBuilder()
            .addString("id")
            .addInt("account")
            .build(),
        service = new DefaultRpcHandler()(tableContainer)
      )

    val dataSource = new FakeDataSource(ListMap(
      "row1" -> Map("id" -> "row1", "name" -> "Becky Thatcher", "account" -> 12355, "hiddenColumn" -> 10),
      "row2" -> Map("id" -> "row2", "name" -> "Tom Sawyer", "account" -> 45321, "hiddenColumn" -> 10),
      "row3" -> Map("id" -> "row3", "name" -> "Huckleberry Finn", "account" -> 89564, "hiddenColumn" -> 11),
      "row4" -> Map("id" -> "row4", "name" -> "Tom Thatcher", "account" -> 12355, "hiddenColumn" -> 10),
      "row5" -> Map("id" -> "row5", "name" -> "Sid Sawyer", "account" -> 42262, "hiddenColumn" -> 10),
      "row6" -> Map("id" -> "row6", "name" -> "Joe Harper", "account" -> 65879, "hiddenColumn" -> 10),
      "row7" -> Map("id" -> "row7", "name" -> "Jim Baker", "account" -> 88875, "hiddenColumn" -> 10),
      "row8" -> Map("id" -> "row8", "name" -> "Amy Lawrence", "account" -> 45897, "hiddenColumn" -> 15),
      "row9" -> Map("id" -> "row9", "name" -> "Ben Rodgers", "account" -> 23564, "hiddenColumn" -> 10),
      "row10" -> Map("id" -> "row10", "name" -> "John Murrell", "account" -> 33657, "hiddenColumn" -> 10),
      "row11" -> Map("id" -> "row11", "name" -> "Sally Phelps", "account" -> 99854, "hiddenColumn" -> 10),
      "row12" -> Map("id" -> "row12", "name" -> "Polly Phelps", "account" -> 78458, "hiddenColumn" -> 10),
      "row13" -> Map("id" -> "row13", "name" -> "Polly Phelps", "account" -> 54874, "hiddenColumn" -> 10),
      "row14" -> Map("id" -> "row14", "name" -> "Johnny Cash", "account" -> 54875, "hiddenColumn" -> 10),
      "row15" -> Map("id" -> "row15", "name" -> "Tom DeLay", "account" -> 54876, "hiddenColumn" -> 10),
    ))

    val providerFactory = (table: DataTable, _: AbstractVuuServer) => new TestProvider(table, dataSource)
    val tableDef2 = TableDef(
      name = "default",
      keyField = "id",
      columns =
        new ColumnBuilder()
          .addString("id")
          .build()
    )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(tableDef, viewPortDefFactory, providerFactory)
      .addTableForTest(tableDef2)
      .asModule()
  }

  private def createViewPort(tableName: String): String = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(0, 10), Array("*"))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(10)
    viewPortId
  }

}
