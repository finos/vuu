package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, SessionTableDef, TableDef, TableDefOptions, ViewPortDef}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.rpc.{AllowAllRpcPermissionChecker, CreateSessionTableRpcHandler, EndEditSessionRpcHandler, RpcErrorResult, RpcNames, RpcParams, RpcPermissionChecker, RpcSuccessResult, ViewPortContext}
import org.finos.vuu.net.{CreateViewPortRequest, CreateViewPortSuccess, RpcRequest, RpcResponseNew, SelectRowRangeRequest, SelectRowRangeSuccess, SelectRowRequest, SelectRowSuccess}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProviderFactory}

import scala.collection.immutable.ListMap

class EditInSessionTableRpcWSApiTest extends WebSocketApiTestBase {
  private val allColumns = new ColumnBuilder()
    .addString("Id")
    .addString("Name")
    .addInt("Account")
    .build();
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
  private val maxSessionTableSize = 10 // configured in CoreServerApiTest

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

  // TODO add more tests:
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
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, 0)
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
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, 3)
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
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, 3)
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
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, maxSessionTableSize)
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
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, 2)
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
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, maxSessionTableSize)
    }


    Scenario("Request to create a session table failed for copying from columns not in source table") {
      Given("a view port exist")
      val viewPortId = createViewPortAndVerifyDataSize(tableName1, 3)

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

      createViewPortAndVerifyDataSize(sessionTableName, 0)
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

      createViewPortAndVerifyDataSize(sessionTableName, 3)
    }
  }

  private def createTableDef(tableName: String, isEditable: Boolean): TableDef = {
    TableDef(
      name = tableName,
      keyField = "Id",
      customColumns = allColumns,
      options = TableDefOptions(
        isEditable = isEditable
      )
    )
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val dataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 123),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 456),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 789),
    ))
    val providerFactory = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, dataSource)
    val largeDataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Name" -> "user1", "Account" -> 1),
      "row2" -> Map("Id" -> "row2", "Name" -> "user2", "Account" -> 2),
      "row3" -> Map("Id" -> "row3", "Name" -> "user3", "Account" -> 3),
      "row4" -> Map("Id" -> "row4", "Name" -> "user4", "Account" -> 4),
      "row5" -> Map("Id" -> "row5", "Name" -> "user5", "Account" -> 5),
      "row6" -> Map("Id" -> "row6", "Name" -> "user6", "Account" -> 6),
      "row7" -> Map("Id" -> "row7", "Name" -> "user7", "Account" -> 7),
      "row8" -> Map("Id" -> "row8", "Name" -> "user8", "Account" -> 8),
      "row9" -> Map("Id" -> "row9", "Name" -> "user9", "Account" -> 9),
      "row10" -> Map("Id" -> "row10", "Name" -> "user10", "Account" -> 10),
      "row11" -> Map("Id" -> "row11", "Name" -> "user11", "Account" -> 11),
      "row12" -> Map("Id" -> "row12", "Name" -> "user12", "Account" -> 12),
      "row13" -> Map("Id" -> "row13", "Name" -> "user13", "Account" -> 13),
      "row14" -> Map("Id" -> "row14", "Name" -> "user14", "Account" -> 14),
      "row15" -> Map("Id" -> "row15", "Name" -> "user15", "Account" -> 15),
    ))
    val largeProviderFactory = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, largeDataSource)

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = allColumns,
        service = new DummyCreateSessionTableRpcHandler()(using AllowAllRpcPermissionChecker, tableContainer)
      )
    val viewPortDefFactoryForSessionTable = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = allColumns,
        service = new DummyEndEditSessionHandler(using tableContainer)
      )
    val noEnoughPermissionViewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = allColumns,
        service = new DummyCreateSessionTableRpcHandler()(using AllDisabledRpcPermissionChecker, tableContainer)
      )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(createTableDef(tableName1, true), viewPortDefFactory, providerFactory)
      .addTableForTest(createTableDef(noEnoughPermissionTableName, true), noEnoughPermissionViewPortDefFactory, providerFactory)
      .addTableForTest(createTableDef(nonEditableTableName, false), viewPortDefFactory, providerFactory)
      .addTableForTest(createTableDef(largeTableName, true), viewPortDefFactory, largeProviderFactory)
      .addSessionTable(SessionTableDef(
        name = defaultEditTableName,
        keyField = "Id",
        customColumns = allColumns
      ), viewPortDefFactoryForSessionTable)
      .addSessionTable(SessionTableDef(
        name = defaultImportTableName,
        keyField = "Id",
        customColumns = allColumns
      ), viewPortDefFactoryForSessionTable)
      .addSessionTable(SessionTableDef(
        name = defaultExportTableName,
        keyField = "Id",
        customColumns = allColumns
      ), viewPortDefFactoryForSessionTable)
      .addSessionTable(SessionTableDef(
        name = sessionTableName1,
        keyField = "Id",
        customColumns = allColumns
      ), viewPortDefFactoryForSessionTable)
      .addSessionTable(SessionTableDef(
        name = largeSessionTableDefName,
        keyField = "Id",
        customColumns = allColumns
      ), viewPortDefFactoryForSessionTable)
      .asModule()
  }

  private def createViewPort(tableName: String) = {
    createViewPortAndVerifyDataSize(tableName, 3)
  }

  private def createViewPortAndVerifyDataSize(tableName: String, expectedRowCount: Int) = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(0, 100), columns = Array("*"))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(viewPortId, expectedRowCount)
    viewPortId
  }
}

class DummyCreateSessionTableRpcHandler()(using rpcPermissionChecker: RpcPermissionChecker, tableContainer: TableContainer) extends CreateSessionTableRpcHandler(rpcPermissionChecker, tableContainer) {}

class DummyEndEditSessionHandler(implicit tableContainer: TableContainer) extends EndEditSessionRpcHandler {

  override protected def verifyPermission(params: RpcParams): Boolean = ???

  override protected def validateData(params: RpcParams): Boolean = ???

  override protected def submit(params: RpcParams): Boolean = ???
}

private object AllDisabledRpcPermissionChecker extends RpcPermissionChecker {
  override def isRpcAllowed(rpcName: String, vuuUser: VuuUser): Boolean = false
}