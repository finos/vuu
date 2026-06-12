package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, TableDef, ViewPortDef}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.row.RowUpdate
import org.finos.vuu.net.row.RowUpdateType.Update
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.net.{ChangeViewPortReject, ChangeViewPortRequest, ChangeViewPortSuccess, CreateViewPortRequest, CreateViewPortSuccess, TableRowUpdates}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider, TestProviderFactory}

import scala.annotation.tailrec
import scala.collection.immutable.ListMap

class ChangeViewPortWSApiTest extends WebSocketApiTestBase {
  private val tableName1 = "ChangeVPTest1"
  private val tableName2 = "ChangeVPTest2"
  private val moduleName = "TableWSApiTest"
  private val testProviderFactory = new TestProviderFactory

  Scenario("Add a valid column to viewport") {
    val viewPortId: String = createViewPort(tableName1)

    When("Request adding a column to viewport")
    val changeVPRequest = ChangeViewPortRequest(
      viewPortId = viewPortId,
      columns = Array("id", "name", "account"))
    val requestId = vuuClient.send(sessionId, changeVPRequest)

    Then("Viewport is updated successfully")
    val changeVPResponse = vuuClient.awaitForResponse(requestId)
    val responseBody = assertBodyIsInstanceOf[ChangeViewPortSuccess](changeVPResponse)
    responseBody.viewPortId shouldEqual viewPortId

    When("A new row is added to table")
    updateTable(tableName1)

    Then("Viewport should have 3 columns now")
    val row3 = waitForTableRowUpdate("row3")
    row3.data.length shouldEqual 3
  }

  Scenario("Add a invalid column to viewport") {
    val viewPortId: String = createViewPort(tableName2)

    When("Request adding a column to viewport")
    val changeVPRequest = ChangeViewPortRequest(
      viewPortId = viewPortId,
      columns = Array("id", "name", "unknown"))
    val requestId = vuuClient.send(sessionId, changeVPRequest)

    Then("Change viewport request is rejected")
    val changeVPResponse = vuuClient.awaitForResponse(requestId)
    val responseBody = assertBodyIsInstanceOf[ChangeViewPortReject](changeVPResponse)
    responseBody.viewPortId shouldEqual viewPortId

    When("A new row is added to table")
    updateTable(tableName2)

    Then("Viewport still has 2 columns")
    val row3 = waitForTableRowUpdate("row3")
    row3.data.length shouldEqual 2
  }

  private def createTableDef(tableName: String): TableDef = {
    TableDef(
      name = tableName,
      keyField = "id",
      columns =
        new ColumnBuilder()
          .addString("id")
          .addString("name")
          .addInt("account")
          .build()
    )
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
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

    val providerFactory = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, dataSource)

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(createTableDef(tableName1), viewPortDefFactory, providerFactory)
      .addTableForTest(createTableDef(tableName2), viewPortDefFactory, providerFactory)
      .asModule()
  }

  private def createViewPort(tableName: String): String = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(0, 10), Array("id", "account"))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(2)
    viewPortId
  }

  private def updateTable(tableName: String): Unit = {
    val newDataSource = new FakeDataSource(ListMap(
      "row3" -> Map("id" -> "row3", "name" -> "Jim Baker", "account" -> 11111)
    ))
    testProviderFactory.getProvider(tableName).update(newDataSource)
  }

  @tailrec
  private def waitForTableRowUpdate(rowKey: String): RowUpdate = {
    val tableRowUpdates = vuuClient.awaitForMsgWithBody[TableRowUpdates]
    tableRowUpdates match {
      case None => fail("No table row updates")
      case Some(value) =>
        val row = value.rows
          .filter(p => p.updateType == Update)
          .find(row => row.rowKey == rowKey)
          .orNull
        if (row == null) {
          waitForTableRowUpdate(rowKey)
        } else {
          row
        }
    }
  }
}
