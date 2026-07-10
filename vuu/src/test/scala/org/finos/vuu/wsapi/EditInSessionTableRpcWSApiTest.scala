package org.finos.vuu.wsapi

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.{ColumnBuilder, SessionTableDef, TableDef, ViewPortDef}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.{CreateViewPortRequest, CreateViewPortSuccess, RpcRequest, RpcResponseNew}
import org.finos.vuu.net.rpc.{CreateSessionTableRpcHandler, EndEditSessionRpcHandler, RpcHandler, RpcNames, RpcSuccessResult, ViewPortContext}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProviderFactory}

import scala.collection.immutable.ListMap

class EditInSessionTableRpcWSApiTest extends WebSocketApiTestBase {
  private val tableName1 = "EditInSessionTest1"
  private val sessionTableName1 = "EditInSessionTest1Session"
  private val moduleName = "EditInSessionTableRpcTest"
  private val testProviderFactory = new TestProviderFactory

  // TODO 2069 add more scenarios, test non-editable table and column

  Feature("[Web Socket API] begin and end edit in a session table") {
    Scenario("edit in an empty session table") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request beginEditSession with empty table")
      val beginEditRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionTableName" -> sessionTableName1,
          "copyOption" -> "Empty",
          "columnsToCopy" -> "Id,Name"
        ))
      val requestId = vuuClient.send(sessionId, beginEditRequest)

      Then("empty session table is created")
      val beginEditResponse = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](beginEditResponse)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
    }
  }

  private def createTableDef(tableName: String): TableDef = {
    TableDef(
      name = tableName,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id", true)
          .addString("Name", true)
          .addInt("Account", true)
          .build(),
      isEditable = true
    )
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val dataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 123),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 456),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 789),
    ))
    val providerFactory = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, dataSource)

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build(),
        service = new CreateSessionTableRpcHandler(using tableContainer)
      )

    val viewPortDefFactoryForSessionTable = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build(),
        service = new TestHandler(using tableContainer)
      )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(createTableDef(tableName1), viewPortDefFactory, providerFactory)
      .addSessionTable(SessionTableDef(
        name = sessionTableName1,
        keyField = "Id",
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build()
      ), viewPortDefFactoryForSessionTable)
      .asModule()
  }

  private def createViewPort(tableName: String) = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(0, 100), columns = Array("Id", "Name", "Account"))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(3)
    viewPortId
  }
}

class TestHandler(implicit tableContainer: TableContainer) extends EndEditSessionRpcHandler with StrictLogging {

  override def validData(): Boolean = ???

  override def submitData(): Boolean = ???
}