package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, SessionTableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.column.ColumnNames.VuuRowNum
import org.finos.vuu.core.table.{DataTable, InMemSessionDataTable, TableContainer}
import org.finos.vuu.net.rpc.sessiontable.{CreateSessionTableRpcHandler, ImportSessionRpcHandler}
import org.finos.vuu.net.rpc.{AllowAllRpcPermissionChecker, RpcErrorResult, RpcFunctionFailure, RpcFunctionResult, RpcFunctionSuccess, RpcHandler, RpcNames, RpcParams, RpcPermissionChecker, RpcSuccessResult, ViewPortContext}
import org.finos.vuu.net.{ClientSessionId, RpcRequest, RpcResponseNew}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.RowSource
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.TestProviderFactory

// Test default implementation of RPCs in ImportSessionRpcHandler
class ImportSessionRpcHandlerWSApiTest extends WebSocketApiTestBase {
  private val moduleName = "ImportSessionRpcHandlerTest"
  private val sourceTableName = "sourcetable"
  private val sessionTableName = "sessiontable"
  private val testProviderFactory = new TestProviderFactory
  private val maxSessionTableSize = 10 // configured in CoreServerApiTest

  Feature("[Web Socket API] RPC supported by ImportSessionRpcHandler") {

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

        When(s"request $rpcName")
        val requestId2 = vuuClient.send(sessionId, RpcRequest(ViewPortContext(viewPortId2), RpcNames.DeleteRowRpc, Map()))

        Then(s"$rpcName not supported")
        val response2 = vuuClient.awaitForResponse(requestId2)
        val responseBody2 = assertBodyIsInstanceOf[RpcResponseNew](response2)
        responseBody2.rpcName shouldEqual RpcNames.DeleteRowRpc
        val rpcResult2 = assertAndCastAsInstanceOf[RpcErrorResult](responseBody2.result)
        rpcResult2.errorMessage shouldBe "Not supported"
      }
    }
  }

  override protected def defineModuleWithTestTables(): ViewServerModule = {
    val columns = testProviderFactory.columns
    val providerFactory = testProviderFactory.providerFactory
    val largeProviderFactory = testProviderFactory.largeProviderFactory

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = columns,
        service = new CreateEmptySessionTableRpcHandler(tableContainer)
      )
    val viewPortDefFactoryForSessionTable = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = columns,
        service = new MyImportSessionTableRpcHandler(tableContainer)
      )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(testProviderFactory.createTableDef(sourceTableName), viewPortDefFactory, providerFactory)
      .addSessionTable(SessionTableDef(
        name = sessionTableName,
        keyField = VuuRowNum,
        customColumns = new ColumnBuilder()
          .addString(VuuRowNum)
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .build()
      ), viewPortDefFactoryForSessionTable)
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

  class MyImportSessionTableRpcHandler(tableContainer: TableContainer) extends ImportSessionRpcHandler {
    override protected def addRowWithoutVuuMsg(params: RpcParams): RpcFunctionResult = ???
  }
}