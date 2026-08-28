package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, SessionTableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.DefaultColumn.MSG
import org.finos.vuu.core.table.column.ColumnNames.VuuRowNum
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.net.rpc.sessiontable.ImportSessionRpcHandler
import org.finos.vuu.net.rpc.{AllowAllRpcPermissionChecker, DisableAllRpcPermissionChecker, RpcErrorResult, RpcFunctionResult, RpcFunctionSuccess, RpcHandler, RpcNames, RpcParams, RpcSuccessResult, ViewPortContext}
import org.finos.vuu.net.{RpcRequest, RpcResponseNew}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{TestProviderFactory, TestTable}

// Test default implementation of RPCs in ImportSessionRpcHandler
class ImportSessionRpcHandlerWSApiTest extends WebSocketApiTestBase {
  private val moduleName = "ImportSessionRpcHandlerTest"
  private val sourceTableName = "sourcetable"
  private val sessionTableName = "sessiontable"
  private val testProviderFactory = new TestProviderFactory
  private val maxSessionTableSize = 10

  Feature("[Web Socket API] RPC supported by ImportSessionRpcHandler") {

    Scenario("Cannot add row if table size reaches limit") {
      Given("A large session table is created for import")
      val viewPortId = createViewPort(sourceTableName)
      val requestId = vuuClient.send(sessionId, RpcRequest(ViewPortContext(viewPortId), "createLargeTable", Map()))
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")

      Given("A view port exists for session table")
      val viewPortId2 = createViewPortAndVerifyDataSize(sessionTableName, moduleName, 0)

      When("Request addRow")
      val someData = Map()
      val request = RpcRequest(ViewPortContext(viewPortId2), RpcNames.AddRowRpc, Map("data" -> someData))
      val requestId2 = vuuClient.send(sessionId, request)

      Then("New row cannot be added")
      val response2 = vuuClient.awaitForResponse(requestId2)
      val responseBody2 = assertBodyIsInstanceOf[RpcResponseNew](response2)
      responseBody2.rpcName shouldEqual RpcNames.AddRowRpc
      val rpcResult2 = assertAndCastAsInstanceOf[RpcErrorResult](responseBody2.result)
      rpcResult2.errorMessage shouldBe "Unable to add row. Session table reached max size."
    }

    Scenario("ImportSessionRpcHandler supports addRow for vuuMsg") {
      Given("A session table is created for import")
      val viewPortId = createViewPort(sourceTableName)
      val requestId = vuuClient.send(sessionId, RpcRequest(ViewPortContext(viewPortId), "createTable", Map()))
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")

      Given("A view port exists for session table")
      val viewPortId2 = createViewPortAndVerifyDataSize(sessionTableName, moduleName, 0)

      When("Request addRow")
      val data = Map(VuuRowNum -> "1", MSG.name -> "some message")
      val request = RpcRequest(ViewPortContext(viewPortId2), RpcNames.AddRowRpc, Map("data" -> data))
      val requestId2 = vuuClient.send(sessionId, request)

      Then("New row added successfully")
      val response2 = vuuClient.awaitForResponse(requestId2)
      val responseBody2 = assertBodyIsInstanceOf[RpcResponseNew](response2)
      responseBody2.rpcName shouldEqual RpcNames.AddRowRpc
      val rpcResult2 = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody2.result)
    }

    Scenario("ImportSessionRpcHandler supports addRow for row data") {
      Given("A session table is created for import")
      val viewPortId = createViewPort(sourceTableName)
      val requestId = vuuClient.send(sessionId, RpcRequest(ViewPortContext(viewPortId), "createTable", Map()))
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")

      Given("A view port exists for session table")
      val viewPortId2 = createViewPortAndVerifyDataSize(sessionTableName, moduleName, 0)

      When("Request addRow")
      val data = Map(VuuRowNum -> "1", MSG.name -> null, "Id" -> 123, "Name" -> "user1", "Account" -> 456)
      val request = RpcRequest(ViewPortContext(viewPortId2), RpcNames.AddRowRpc, Map("data" -> data))
      val requestId2 = vuuClient.send(sessionId, request)

      Then("New row added successfully")
      val response2 = vuuClient.awaitForResponse(requestId2)
      val responseBody2 = assertBodyIsInstanceOf[RpcResponseNew](response2)
      responseBody2.rpcName shouldEqual RpcNames.AddRowRpc
      val rpcResult2 = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody2.result)
    }
  }

  Feature("[Web Socket API] RPC not supported by ImportSessionRpcHandler") {

    val rpcNames = List(
      RpcNames.DeleteRowRpc,
      RpcNames.DeleteSelectedRowsRpc,
      RpcNames.DeleteCellRpc,
      RpcNames.EditRowRpc,
      RpcNames.EditCellRpc,
      RpcNames.SubmitFormRpc,
      RpcNames.CloseFormRpc,
      RpcNames.UndoRowChangeRpc
    )

    rpcNames.foreach { rpcName =>
      Scenario(s"$rpcName not supported") {
        Given("a session table is created for import")
        val viewPortId = createViewPort(sourceTableName)
        val requestId = vuuClient.send(sessionId, RpcRequest(ViewPortContext(viewPortId), "createTable", Map()))
        val response = vuuClient.awaitForResponse(requestId)
        val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
        val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
        val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")

        Given("A view port exists for session table")
        val viewPortId2 = createViewPortAndVerifyDataSize(sessionTableName, moduleName, 0)

        When(s"Request $rpcName")
        val requestId2 = vuuClient.send(sessionId, RpcRequest(ViewPortContext(viewPortId2), rpcName, Map()))

        Then(s"$rpcName not supported")
        val response2 = vuuClient.awaitForResponse(requestId2)
        val responseBody2 = assertBodyIsInstanceOf[RpcResponseNew](response2)
        responseBody2.rpcName shouldEqual rpcName
        val rpcResult2 = assertAndCastAsInstanceOf[RpcErrorResult](responseBody2.result)
        rpcResult2.errorMessage shouldBe "Not supported"
      }
    }
  }

  override protected def defineModuleWithTestTables(): ViewServerModule = {
    val viewPortDefFactoryForSource = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = TestTable.columns,
        service = new CreateEmptySessionTableRpcHandler(tableContainer)
      )

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = TestTable.columns,
        service = new TestImportSessionTableRpcHandler(tableContainer.rpcOptions.maxSessionTableSize)
      )

    ModuleFactory.withNamespace(moduleName)
      // add a table so we can call CreateEmptySessionTableRpcHandler
      .addTableForTest(TestTable.createTableDef(sourceTableName), viewPortDefFactoryForSource, testProviderFactory.providerFactory)
      .addSessionTable(SessionTableDef(
        name = sessionTableName,
        keyField = VuuRowNum,
        customColumns = TestTable.columns ++ new ColumnBuilder().addString(VuuRowNum).build()),
        viewPortDefFactory)
      .asModule()
  }

  private def createViewPort(tableName: String) = {
    createViewPortAndVerifyDataSize(tableName, moduleName, 3)
  }

  class CreateEmptySessionTableRpcHandler(tableContainer: TableContainer) extends RpcHandler {

    registerRpc("createTable", createEmptySessionTable)
    registerRpc("createLargeTable", createLargeSessionTable)

    def createEmptySessionTable(params: RpcParams): RpcFunctionResult = {
      val sessionTableSource = tableContainer.getTable(sessionTableName)
      val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, params.ctx.session)
      RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name)))
    }

    def createLargeSessionTable(params: RpcParams): RpcFunctionResult = {
      val sessionTableSource = tableContainer.getTable(sessionTableName)
      val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, params.ctx.session)
      sessionTable.processUpdate("1", RowWithData("1", Map()))
      sessionTable.processUpdate("2", RowWithData("2", Map()))
      sessionTable.processUpdate("3", RowWithData("3", Map()))
      sessionTable.processUpdate("4", RowWithData("4", Map()))
      sessionTable.processUpdate("5", RowWithData("5", Map()))
      sessionTable.processUpdate("6", RowWithData("6", Map()))
      sessionTable.processUpdate("7", RowWithData("7", Map()))
      sessionTable.processUpdate("8", RowWithData("8", Map()))
      sessionTable.processUpdate("9", RowWithData("9", Map()))
      sessionTable.processUpdate("10", RowWithData("10", Map()))
      RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name)))
    }
  }

  class TestImportSessionTableRpcHandler(override val maxSessionTableSize: Int) extends ImportSessionRpcHandler() {

    override protected def addRowWithoutVuuMsg(params: RpcParams): RpcFunctionResult = new RpcFunctionSuccess()
  }
}