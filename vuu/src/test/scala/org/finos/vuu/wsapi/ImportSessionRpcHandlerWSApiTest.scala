package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, SessionTableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.DefaultColumn.MSG
import org.finos.vuu.core.table.column.ColumnNames.VuuRowNum
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.rpc.sessiontable.ImportSessionRpcHandler
import org.finos.vuu.net.rpc.{RpcErrorResult, RpcFunctionResult, RpcFunctionSuccess, RpcHandler, RpcNames, RpcParams, RpcSuccessResult, ViewPortContext}
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
  private val maxSessionTableSize = 10 // configured in CoreServerApiTest

  Feature("[Web Socket API] RPC supported by ImportSessionRpcHandler") {
    Scenario("ImportSessionRpcHandler supports addRow for vuuMsg") {
      Given("a session table is created for import")
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

    }

    Scenario("Cannot add row if table size reaches limit ") {

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
    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = TestTable.columns,
        service = new CreateEmptySessionTableRpcHandler(tableContainer)
      )
    val viewPortDefFactoryForSessionTable = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = TestTable.columns,
        service = new MyImportSessionTableRpcHandler(tableContainer)
      )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(TestTable.createTableDef(sourceTableName), viewPortDefFactory, testProviderFactory.providerFactory)
      .addSessionTable(SessionTableDef(
        name = sessionTableName,
        keyField = VuuRowNum,
        customColumns = TestTable.columns ++ new ColumnBuilder().addString(VuuRowNum).build()),
        viewPortDefFactoryForSessionTable)
      .asModule()
  }

  private def createViewPort(tableName: String) = {
    createViewPortAndVerifyDataSize(tableName, moduleName, 3)
  }

  class CreateEmptySessionTableRpcHandler(tableContainer: TableContainer) extends RpcHandler {

    registerRpc("createTable", createEmptySessionTable)

    def createEmptySessionTable(params: RpcParams): RpcFunctionResult = {
      val sessionTableSource = tableContainer.getTable(sessionTableName)
      val sessionTable = tableContainer.createSimpleSessionTable(sessionTableSource, params.ctx.session)
      RpcFunctionSuccess(Some(Map("sessionTable" -> sessionTable.name)))
    }
  }

  class MyImportSessionTableRpcHandler(tableContainer: TableContainer) extends ImportSessionRpcHandler(tableContainer) {
    override protected def addRowWithoutVuuMsg(params: RpcParams): RpcFunctionResult = new RpcFunctionSuccess()
  }
}