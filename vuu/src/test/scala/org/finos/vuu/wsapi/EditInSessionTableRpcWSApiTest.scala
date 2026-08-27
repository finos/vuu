package org.finos.vuu.wsapi

import org.finos.vuu.api.{SessionTableDef, ViewPortDef}
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.rpc.sessiontable.{CreateSessionTableRpcHandler, EndSessionRpcHandler}
import org.finos.vuu.net.rpc.{AllowAllRpcPermissionChecker, RpcErrorResult, RpcNames, RpcParams, RpcPermissionChecker, RpcSuccessResult, ViewPortContext}
import org.finos.vuu.net.{RpcRequest, RpcResponseNew, SelectRowRangeRequest, SelectRowRangeSuccess, SelectRowRequest, SelectRowSuccess}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{TestProviderFactory, TestTable}

class EditInSessionTableRpcWSApiTest extends WebSocketApiTestBase {
  private val noEnoughPermissionTableName = "noEnoughPermissionTable"
  private val nonEditableTableName = "nonEditableTable"
  private val tableName1 = "testTable1"
  private val largeTableName = "largeTable"
  private val defaultEditTableName = "edit-" + tableName1
  private val defaultImportTableName = "import-" + tableName1
  private val defaultExportTableName = "export-" + tableName1
  private val sessionTableName1 = "testSessionTable1"
  private val largeSessionTableDefName = "edit-" + largeTableName
  private val moduleName = "EditInSessionTableRpcTest"
  private val testProviderFactory = new TestProviderFactory
  private val maxSessionTableSize = 10 // configured in TestStartUp

  Feature("[Web Socket API] create a session table failed") {
    Scenario("Request to create a session table failed for no enough permission") {
      Given("a view port exist")
      val viewPortId = createViewPort(noEnoughPermissionTableName)

      When("request createSessionTable")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "Empty",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is not created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcErrorResult](responseBody.result)
      rpcResult.errorMessage shouldBe "No permission to create session table."
    }

    Scenario("create a session table failed for undefined session type") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table using undefined session type")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionType" -> "dummy"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is not created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcErrorResult](responseBody.result)
      rpcResult.errorMessage shouldBe "Session type undefined"
    }
  }

  // TODO 2231 add more tests:
  // Test when vp is filtered and sorted, the data copied to session table is also filtered and sorted
  // Test when copying from a given list of columns, only data from those columns are copied
  Feature("[Web Socket API] create a session table for edit mode") {

    Scenario("Request to create a session table failed for non-editable table") {
      Given("a view port exist")
      val viewPortId = createViewPort(nonEditableTableName)

      When("request createSessionTable for non-editable source table")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "Empty",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is not created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcErrorResult](responseBody.result)
      rpcResult.errorMessage shouldBe "Table not editable"
    }

    Scenario("create a session table from source table using default session table def") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table using default session table def")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "Empty",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created using default session table def")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      sessionTableName.contains("simple-edit-testTable1") shouldBe true
    }

    Scenario("create a session table from source table using a specific session table def") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table using given session table def")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionTableName" -> sessionTableName1,
          "copyOption" -> "Empty",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created using given session table def")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      sessionTableName.contains("simple-testSessionTable1") shouldBe true
    }

    Scenario("create an empty session table from source table") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating an empty session table")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "Empty",
          "columnsToCopy" -> "Id,Name",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("empty session table is created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, moduleName, 0)
    }

    Scenario("create a session table and copy all rows from all columns from source table") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table and copy all rows from all columns")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "All",
          "columnsToCopy" -> "*",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created with all data")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, moduleName, 3)
    }

    Scenario("create a session table and copy all rows from some columns from source table") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table and copy all rows from some columns")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "All",
          "columnsToCopy" -> "Id,Name",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created with all data")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, moduleName, 3)
    }

    Scenario("create a session table and copy all rows up to max threshold from source table") {
      Given("a view port exist")
      val viewPortId = createViewPort(largeTableName)

      When("request creating a session table and copy all rows")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "All",
          "columnsToCopy" -> "*",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created with max number of rows")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, moduleName, maxSessionTableSize)
    }

    Scenario("create a session table from selected rows of source table") {
      Given("a view port exist and some rows are selected")
      val viewPortId = createViewPort(tableName1)

      val selectRowRequest1 = SelectRowRequest(viewPortId, "row1", false)
      val selectRowRequest2 = SelectRowRequest(viewPortId, "row3", true)
      vuuClient.send(sessionId, selectRowRequest1)
      vuuClient.awaitForMsgWithBody[SelectRowSuccess]
      vuuClient.send(sessionId, selectRowRequest2)
      vuuClient.awaitForMsgWithBody[SelectRowSuccess]

      When("request creating a session table from selected rows")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "Selected",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, moduleName, 2)
    }

    Scenario("create a session table and copy selected rows up to max threshold from source table") {
      Given("a view port exist and some rows are selected")
      val viewPortId = createViewPort(largeTableName)

      val selectRowRequest = SelectRowRangeRequest(viewPortId, "row1", "row13", false)
      vuuClient.send(sessionId, selectRowRequest)
      vuuClient.awaitForMsgWithBody[SelectRowRangeSuccess]

      When("request creating a session table and copy selected rows")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "Selected",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created with max number of rows")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, moduleName, maxSessionTableSize)
    }


    Scenario("Request to create a session table failed for copying from columns not in source table") {
      Given("a view port exist")
      val viewPortId = createViewPortAndVerifyDataSize(tableName1, moduleName, 3)

      When("request createSessionTable and copy from columns not in source table")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "copyOption" -> "Empty",
          "columnsToCopy" -> "DUMMY1,DUMMY2",
          "sessionType" -> "edit"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is not created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcErrorResult](responseBody.result)
      rpcResult.errorMessage shouldBe "Column(s) not found in source table."
    }
  }

  Feature("[Web Socket API] create a session table for import mode") {
    Scenario("Request to create a session table failed for non-editable table") {
      Given("a view port exist")
      val viewPortId = createViewPort(nonEditableTableName)

      When("request createSessionTable for non-editable source table")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionType" -> "import"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is not created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcErrorResult](responseBody.result)
      rpcResult.errorMessage shouldBe "Table not editable"
    }

    Scenario("create a session table from source table using default name") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table using default name")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionType" -> "import"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created using default name")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      sessionTableName.contains("simple-import-testTable1") shouldBe true

      createViewPortAndVerifyDataSize(sessionTableName, moduleName, 0)
    }

    Scenario("create a session table from source table using a given name") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table using given session table def")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionType" -> "import",
          "sessionTableName" -> sessionTableName1
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created using given session table def")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      sessionTableName.contains("simple-testSessionTable1") shouldBe true

      createViewPortAndVerifyDataSize(sessionTableName, moduleName, 0)
    }
  }

  Feature("[Web Socket API] create a session table for export mode") {
    Scenario("create a session table from source table using default name") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table using default name")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionType" -> "export"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created using default name")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      sessionTableName.contains("simple-export-testTable1") shouldBe true

      createViewPortAndVerifyDataSize(sessionTableName, moduleName, 3)
    }

    Scenario("create a session table from source table using a given name") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating a session table using given session table def")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionType" -> "export",
          "sessionTableName" -> sessionTableName1
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created using given session table def")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      sessionTableName.contains("simple-testSessionTable1") shouldBe true

      createViewPortAndVerifyDataSize(sessionTableName, moduleName, 3)
    }
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = TestTable.columns,
        service = new DummyCreateSessionTableRpcHandler()(using AllowAllRpcPermissionChecker, tableContainer)
      )
    val viewPortDefFactoryForSessionTable = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = TestTable.columns,
        service = new DummyEndSessionHandler(using tableContainer)
      )
    val noEnoughPermissionViewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = TestTable.columns,
        service = new DummyCreateSessionTableRpcHandler()(using AllDisabledRpcPermissionChecker, tableContainer)
      )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(TestTable.createTableDef(tableName1, true), viewPortDefFactory, testProviderFactory.providerFactory)
      .addTableForTest(TestTable.createTableDef(noEnoughPermissionTableName, true), noEnoughPermissionViewPortDefFactory, testProviderFactory.providerFactory)
      .addTableForTest(TestTable.createTableDef(nonEditableTableName, false), viewPortDefFactory, testProviderFactory.providerFactory)
      .addTableForTest(TestTable.createTableDef(largeTableName, true), viewPortDefFactory, testProviderFactory.largeProviderFactory)
      .addSessionTable(SessionTableDef(
        name = defaultEditTableName,
        keyField = "Id",
        customColumns = TestTable.columns
      ), viewPortDefFactoryForSessionTable)
      .addSessionTable(SessionTableDef(
        name = defaultImportTableName,
        keyField = "Id",
        customColumns = TestTable.columns
      ), viewPortDefFactoryForSessionTable)
      .addSessionTable(SessionTableDef(
        name = defaultExportTableName,
        keyField = "Id",
        customColumns = TestTable.columns
      ), viewPortDefFactoryForSessionTable)
      .addSessionTable(SessionTableDef(
        name = sessionTableName1,
        keyField = "Id",
        customColumns = TestTable.columns
      ), viewPortDefFactoryForSessionTable)
      .addSessionTable(SessionTableDef(
        name = largeSessionTableDefName,
        keyField = "Id",
        customColumns = TestTable.columns
      ), viewPortDefFactoryForSessionTable)
      .asModule()
  }

  private def createViewPort(tableName: String) = {
    createViewPortAndVerifyDataSize(tableName, moduleName, 3)
  }
}

class DummyCreateSessionTableRpcHandler()(using rpcPermissionChecker: RpcPermissionChecker, tableContainer: TableContainer) extends CreateSessionTableRpcHandler(rpcPermissionChecker, tableContainer) {}

class DummyEndSessionHandler(implicit tableContainer: TableContainer) extends EndSessionRpcHandler(tableContainer) {

  override protected def verifyPermission(params: RpcParams): Boolean = ???

  override protected def validateData(params: RpcParams): Boolean = ???

  override protected def submit(params: RpcParams): Boolean = ???
}

private object AllDisabledRpcPermissionChecker extends RpcPermissionChecker {
  override def isRpcAllowed(rpcName: String, vuuUser: VuuUser): Boolean = false
}