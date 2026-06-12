package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, TableDef, ViewPortDef}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.net.{ChangeViewPortReject, ChangeViewPortRequest, ChangeViewPortSuccess, CreateViewPortRequest, CreateViewPortSuccess}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider}

import scala.collection.immutable.ListMap

class ChangeViewPortWSApiTest extends WebSocketApiTestBase {
  private val tableName = "ChangeVPTest"
  private val moduleName = "TableWSApiTest"

  Scenario("Add a valid column to viewport") {
    val viewPortId: String = createViewPort(tableName)

    When("request adding a column to viewport")
    val changeVPRequest = ChangeViewPortRequest(
      viewPortId = viewPortId,
      columns = Array("id", "name", "account"))
    val requestId = vuuClient.send(sessionId, changeVPRequest)

    Then("viewport is updated")
    val changeVPResponse = vuuClient.awaitForResponse(requestId)
    val responseBody = assertBodyIsInstanceOf[ChangeViewPortSuccess](changeVPResponse)
    responseBody.viewPortId shouldEqual viewPortId
  }

  Scenario("Add a invalid column to viewport") {
    val viewPortId: String = createViewPort(tableName)

    When("request adding a column to viewport")
    val changeVPRequest = ChangeViewPortRequest(
      viewPortId = viewPortId,
      columns = Array("id", "name", "unknown"))
    val requestId = vuuClient.send(sessionId, changeVPRequest)

    Then("viewport is updated")
    val changeVPResponse = vuuClient.awaitForResponse(requestId)
    val responseBody = assertBodyIsInstanceOf[ChangeViewPortReject](changeVPResponse)
    responseBody.viewPortId shouldEqual viewPortId
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val tableDef = TableDef(
      name = tableName,
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
      "row1" -> Map("id" -> "row1", "name" -> "Becky Thatcher", "account" -> 12355),
      "row2" -> Map("id" -> "row2", "name" -> "Tom Sawyer", "account" -> 45321)
    ))

    val providerFactory = (table: DataTable, _: AbstractVuuServer) => new TestProvider(table, dataSource)

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(tableDef, viewPortDefFactory, providerFactory)
      .asModule()
  }

  private def createViewPort(tableName: String): String = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(0, 10), Array("*"))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(2)
    viewPortId
  }

}
