package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, TableDef, ViewPortDef}
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.net.{ErrorResponse, GetTableMetaRequest, GetTableMetaResponse}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.ViewPortTable
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider}

class TableWSApiTest extends WebSocketApiTestBase {

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
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
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

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, _: TableContainer) =>
      ViewPortDef(
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addInt("Account")
            .build(),
        service = new DefaultRpcHandler()
      )

    val providerFactory = (table: DataTable, _: IVuuServer) => new TestProvider(table, new FakeDataSource(Map()))
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

}
