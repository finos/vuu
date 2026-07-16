package org.finos.vuu.wsapi

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.{ColumnBuilder, SessionTableDef, TableDef, ViewPortDef}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.{CreateViewPortRequest, CreateViewPortSuccess, RpcRequest, RpcResponseNew, SelectRowRequest, SelectRowSuccess}
import org.finos.vuu.net.rpc.{CreateSessionTableRpcHandler, EndEditSessionRpcHandler, RpcErrorResult, RpcNames, RpcSuccessResult, ViewPortContext}
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
  private val tableName1 = "EditInSessionTest1"
  private val nonEditableTableName = "NonEditableTable"
  private val largeTableName = "LargeTable"
  private val sessionTableDefName = "EditInSessionTest1Session"
  private val moduleName = "EditInSessionTableRpcTest"
  private val testProviderFactory = new TestProviderFactory
  private val maxCopySize = 10 // configured in CoreServerApiTest

  // TODO 2069 add test scenarios for empty but all columns, selection with all columns, selection with some columns
  // test with large data, have 10 in base table, 5 in vp, add filter and sort
  // test vp is sorted, the data copied to session table is also sorted
  // TODO 2169 do we care about sorting of viewport selection???
  // add a test for selected rows more than max size
  Feature("[Web Socket API] create a session table and copy data from source table") {
    Scenario("create an empty session table from source table") {
      Given("a view port exist")
      val viewPortId = createViewPort(tableName1)

      When("request creating an empty session table")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionTableName" -> sessionTableDefName,
          "copyOption" -> "Empty",
          "columnsToCopy" -> "Id,Name"
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
          "sessionTableName" -> sessionTableDefName,
          "copyOption" -> "All",
          "columnsToCopy" -> "*"
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
          "sessionTableName" -> sessionTableDefName,
          "copyOption" -> "All",
          "columnsToCopy" -> "Id,Name"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created with all data")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, 0)
    }

    Scenario("create a session table and copy all rows up to max threshold from source table") {
      Given("a view port exist")
      val viewPortId = createViewPort(largeTableName)

      When("request creating a session table and copy all rows")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionTableName" -> sessionTableDefName,
          "copyOption" -> "All",
          "columnsToCopy" -> "*"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is created with max number of rows")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      val sessionTableName = rpcResult.data.asInstanceOf[Map[String, String]]("sessionTable")
      val sessionTableViewPortId = createViewPortAndVerifyDataSize(sessionTableName, maxCopySize)
    }

    Scenario("create a session table from selected rows of source table") {
      Given("a view port exist and some rows are selected")
      val viewPortId = createViewPort(tableName1)

      val selectRowRequest1 = SelectRowRequest(viewPortId, "row1", true)
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
          "sessionTableName" -> sessionTableDefName,
          "copyOption" -> "Selected",
          "columnsToCopy" -> "*"
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

    Scenario("Request to create a session table failed for non-editable table") {
      Given("a view port exist")
      val viewPortId = createViewPort(nonEditableTableName)

      When("request createSessionTable for non-editable source table")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionTableName" -> sessionTableDefName,
          "copyOption" -> "Empty",
          "columnsToCopy" -> ""
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is not created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcErrorResult](responseBody.result)
    }

    Scenario("Request to create a session table failed for copying from columns not in source table") {
      Given("a view port exist")
      val viewPortId = createViewPortAndVerifyDataSize(tableName1, 3)

      When("request createSessionTable and copy from columns not in source table")
      val createSessionTableRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.CreateSessionTableRpc,
        params = Map(
          "sessionTableName" -> sessionTableDefName,
          "copyOption" -> "Empty",
          "columnsToCopy" -> "DUMMY"
        ))
      val requestId = vuuClient.send(sessionId, createSessionTableRequest)

      Then("session table is not created")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.CreateSessionTableRpc
      val rpcResult = assertAndCastAsInstanceOf[RpcErrorResult](responseBody.result)
    }
  }

  private def createTableDef(tableName: String, isEditable: Boolean): TableDef = {
    TableDef(
      name = tableName,
      keyField = "Id",
      columns = allColumns,
      isEditable = isEditable
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
      "row2" -> Map("Id" -> "row2", "Name" -> "user1", "Account" -> 2),
      "row3" -> Map("Id" -> "row3", "Name" -> "user1", "Account" -> 3),
      "row4" -> Map("Id" -> "row4", "Name" -> "user1", "Account" -> 4),
      "row5" -> Map("Id" -> "row5", "Name" -> "user1", "Account" -> 5),
      "row6" -> Map("Id" -> "row6", "Name" -> "user1", "Account" -> 6),
      "row7" -> Map("Id" -> "row7", "Name" -> "user1", "Account" -> 7),
      "row8" -> Map("Id" -> "row8", "Name" -> "user1", "Account" -> 8),
      "row9" -> Map("Id" -> "row9", "Name" -> "user1", "Account" -> 9),
      "row10" -> Map("Id" -> "row10", "Name" -> "user1", "Account" -> 10),
      "row11" -> Map("Id" -> "row11", "Name" -> "user1", "Account" -> 11),
    ))
    val largeProviderFactory = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, largeDataSource)

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = allColumns,
        service = new CreateSessionTableRpcHandler(using tableContainer)
      )
    val viewPortDefFactoryForSessionTable = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns = allColumns,
        service = new TestHandler(using tableContainer)
      )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(createTableDef(tableName1, true), viewPortDefFactory, providerFactory)
      .addTableForTest(createTableDef(nonEditableTableName, false), viewPortDefFactory, providerFactory)
      .addTableForTest(createTableDef(largeTableName, true), viewPortDefFactory, largeProviderFactory)
      .addSessionTable(SessionTableDef(
        name = sessionTableDefName,
        keyField = "Id",
        columns = allColumns
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
    waitForData(expectedRowCount)
    viewPortId
  }
}

class TestHandler(implicit tableContainer: TableContainer) extends EndEditSessionRpcHandler with StrictLogging {

  override def verify(): Boolean = ???

  override def submit(): Boolean = ???
}