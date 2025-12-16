package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, TableDef, ViewPortDef}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, DefaultColumn, TableContainer}
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.net.{ErrorResponse, GetTableMetaRequest, GetTableMetaResponse}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.ViewPortTable
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider}

import scala.collection.immutable.ListMap

class TableWSApiTest extends WebSocketApiTestBase {

  private val moduleName = "TEST"

  Feature("[Web Socket API] Get table metadata") {
    Scenario("For a table") {

      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable("TableMetaTest", moduleName)))

      Then("return view port columns in response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[GetTableMetaResponse](response)
      responseBody.columns.length shouldEqual 2
      responseBody.columns shouldEqual Array("Id", "Account")
    }

    Scenario("For a table with no view port def defined") {

      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable("TableMetaDefaultVPTest", moduleName)))

      Then("return table columns as default view port columns in response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[GetTableMetaResponse](response)
      responseBody.columns.length shouldEqual 3
      responseBody.columns should contain theSameElementsAs (Array("Id") ++ DefaultColumn.values.map(_.name))
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

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addInt("Account")
            .build(),
        service = new DefaultRpcHandler()(tableContainer)
      )

    val providerFactory = (table: DataTable, _: AbstractVuuServer) => new TestProvider(table, new FakeDataSource(ListMap()))
    val tableDef2 = TableDef(
      name = "TableMetaDefaultVPTest",
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
}
