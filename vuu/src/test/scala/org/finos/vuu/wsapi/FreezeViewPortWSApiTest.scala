package org.finos.vuu.wsapi

import org.finos.vuu.api._
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.DefaultColumnNames.CreatedTimeColumnName
import org.finos.vuu.core.table.{Columns, DataTable}
import org.finos.vuu.net._
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProviderFactory}

import scala.collection.immutable.ListMap

class FreezeViewPortWSApiTest extends WebSocketApiTestBase {
  private val tableName1 = "FreezingVPTest1"
  private val tableName2 = "FreezingVPTest2"
  private val tableName3 = "FreezingVPTest3"
  private val tableName4 = "FreezingVPTest4"
  private val leftTableName = "FreezingVPTestLeft"
  private val rightTableName = "FreezingVPTestRight"
  private val joinTableName = "FreezingVPTestJoin"
  private val moduleName = "FreezingVPTEST"
  private val fakeViewPortId = "fakeId"
  private val testProviderFactory = new TestProviderFactory

  Feature("[Web Socket API] Freeze view port request") {
    Scenario("Freeze a view port") {
      Given("a view port exist")
      val viewPortId: String = createViewPort(tableName1)

      When("request freezing view port")
      val freezeVPRequest = FreezeViewPortRequest(viewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, freezeVPRequest)

      Then("view port is frozen")
      val freezeVPResponse = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[FreezeViewPortSuccess](freezeVPResponse)
      responseBody.viewPortId shouldEqual viewPortId

      When("An existing row is updated and a new row is added to table")
      updateTable(tableName1)

      Then("Should only update on rows created before frozen time")
      val tableRowUpdatesResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
      tableRowUpdatesResponse.get.rows(0).vpSize shouldEqual 3
    }

    Scenario("Unfreeze a view port") {
      Given("a view port exist")
      val viewPortId: String = createViewPort(tableName2)

      When("request freezing view port")
      val freezeVPRequest = FreezeViewPortRequest(viewPortId)
      val freezeRequestId = vuuClient.send(sessionId, tokenId, freezeVPRequest)

      Then("view port is frozen")
      val freezeVPResponse = vuuClient.awaitForResponse(freezeRequestId)
      val freezeResponseBody = assertBodyIsInstanceOf[FreezeViewPortSuccess](freezeVPResponse)
      freezeResponseBody.viewPortId shouldEqual viewPortId

      When("A new row is added to table")
      addNewRow(tableName2)
      Then("Should not update on a new row when the table is frozen")
      // TODO wait for 100+ miliseconds and verify no TableRowUpdates received

      When("request unfreezing view port")
      val unfreezeVPRequest = UnfreezeViewPortRequest(viewPortId)
      val unfreezeRrequestId = vuuClient.send(sessionId, tokenId, unfreezeVPRequest)

      Then("view port is unfrozen")
      val unfreezeResponse = vuuClient.awaitForResponse(unfreezeRrequestId)
      val unfreezeResponseBody = assertBodyIsInstanceOf[UnfreezeViewPortSuccess](unfreezeResponse)
      unfreezeResponseBody.viewPortId shouldEqual viewPortId

      Then("Should update on all rows")
      val tableRowUpdatesResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
      tableRowUpdatesResponse.get.rows(0).vpSize shouldEqual 4
    }

    Scenario("Freeze a view port that doesn't exist") {
      When("request freezing view port that doesn't exist")
      val request = FreezeViewPortRequest(fakeViewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, request)

      Then("return failure response")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[FreezeViewPortReject](response)
      responseBody.viewPortId shouldEqual fakeViewPortId
      responseBody.errorMessage shouldEqual s"java.lang.Exception: Could not find viewport to freeze $fakeViewPortId"
    }

    Scenario("Unfreeze a view port that doesn't exist") {
      When("request unfreezing view port that doesn't exist")
      val request = UnfreezeViewPortRequest(fakeViewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, request)

      Then("return failure response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[UnfreezeViewPortReject](response)
      responseBody.viewPortId shouldEqual fakeViewPortId
      responseBody.errorMessage shouldEqual s"java.lang.Exception: Could not find viewport to unfreeze $fakeViewPortId"
    }

    Scenario("Freeze a view port that is already frozen") {
      Given("a view port exists")
      val viewPortId: String = createViewPort(tableName3)

      When("request freezing view port")
      val freezeVPRequest1 = FreezeViewPortRequest(viewPortId)
      val requestId1 = vuuClient.send(sessionId, tokenId, freezeVPRequest1)

      Then("view port is frozen")
      val freezeVPResponse = vuuClient.awaitForResponse(requestId1)
      val responseBody = assertBodyIsInstanceOf[FreezeViewPortSuccess](freezeVPResponse)
      responseBody.viewPortId shouldEqual viewPortId

      When("request freezing view port again")
      val freezeVPRequest2 = FreezeViewPortRequest(viewPortId)
      val requestId2 = vuuClient.send(sessionId, tokenId, freezeVPRequest2)

      Then("return failure response")
      val response2 = vuuClient.awaitForResponse(requestId2)
      val responseBody2 = assertBodyIsInstanceOf[FreezeViewPortReject](response2)
      responseBody2.viewPortId shouldEqual viewPortId
      responseBody2.errorMessage shouldEqual s"java.lang.Exception: Could not freeze viewport $viewPortId because it's already frozen"
    }

    Scenario("Unfreeze a view port that is not frozen") {
      Given("a view port exists")
      val viewPortId: String = createViewPort(tableName4)

      When("request unfreezing view port")
      val unfreezeVPRequest = UnfreezeViewPortRequest(viewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, unfreezeVPRequest)

      Then("return failure response")
      val unfreezeVPResponse = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[UnfreezeViewPortReject](unfreezeVPResponse)
      responseBody.viewPortId shouldEqual viewPortId
      responseBody.errorMessage shouldEqual s"java.lang.Exception: Could not unfreeze viewport $viewPortId because it's not frozen"
    }

    /*Scenario("Freeze a view port for a join table") {
      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request freezing view port")
      val freezeVPRequest = FreezeViewPortRequest(viewPortId)
      val requestId = vuuClient.send(sessionId, tokenId, freezeVPRequest)

      Then("view port is frozen")
      val freezeVPResponse = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[FreezeViewPortSuccess](freezeVPResponse)
      responseBody.viewPortId shouldEqual viewPortId

      When("An existing row is updated and a new row is added to table")
      updateJoinTable()
      /*
      add a new row to left table
      add a new row to right table
      a row exist in left table
      add a new row to right table
     validate still shows only 3 rows
       */

      Then("Return only updates of rows created before frozen time")
      val tableRowUpdatesResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
      tableRowUpdatesResponse.get.rows(0).vpSize shouldEqual 3
    }

    Scenario("Unfreeze a view port for a join table") {
      Given("a view port exist")
      val viewPortId: String = createViewPortForJoinTable

      When("request freezing view port")
      val freezeVPRequest = FreezeViewPortRequest(viewPortId)
      val freezeRequestId = vuuClient.send(sessionId, tokenId, freezeVPRequest)

      Then("view port is frozen")
      val freezeVPResponse = vuuClient.awaitForResponse(freezeRequestId)
      val freezeResponseBody = assertBodyIsInstanceOf[FreezeViewPortSuccess](freezeVPResponse)
      freezeResponseBody.viewPortId shouldEqual viewPortId

      When("request unfreezing view port")
      val unfreezeVPRequest = UnfreezeViewPortRequest(viewPortId)
      val unfreezeRrequestId = vuuClient.send(sessionId, tokenId, unfreezeVPRequest)

      Then("view port is unfrozen")
      val unfreezeResponse = vuuClient.awaitForResponse(unfreezeRrequestId)
      val unfreezeResponseBody = assertBodyIsInstanceOf[UnfreezeViewPortSuccess](unfreezeResponse)
      unfreezeResponseBody.viewPortId shouldEqual viewPortId

      When("A new row is added to left table")
      addNewRow()

      Then("Return updates of all rows")
      val tableRowUpdatesResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
      tableRowUpdatesResponse.get.rows(0).vpSize shouldEqual 4
    }*/
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val tableDef1 = TableDef(
      name = tableName1,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .build()
    )

    val tableDef2 = TableDef(
      name = tableName2,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .build()
    )

    val tableDef3 = TableDef(
      name = tableName3,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .build()
    )

    val tableDef4 = TableDef(
      name = tableName4,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .build()
    )

    val lastHour: Long = timeProvider.now() - 3600000
    val dataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 123, CreatedTimeColumnName -> lastHour),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 456, CreatedTimeColumnName -> lastHour),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 789, CreatedTimeColumnName -> lastHour),
    ))
    val providerFactory = (table: DataTable, _: IVuuServer) => testProviderFactory.create(table, dataSource)

    val leftTableDef = TableDef(
      name = leftTableName,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .build(),
      VisualLinks(),
      joinFields = "Id"
    )
    val leftDataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", CreatedTimeColumnName -> lastHour),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", CreatedTimeColumnName -> lastHour),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", CreatedTimeColumnName -> lastHour),
      "row4" -> Map("Id" -> "row4", "Name" -> "Channing Tatum", CreatedTimeColumnName -> lastHour),
    ))
    val leftProviderFactory = (table: DataTable, _: IVuuServer) => testProviderFactory.create(table, leftDataSource)

    val rightTableDef = TableDef(
      name = rightTableName,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Description")
          .build(),
      VisualLinks(),
      joinFields = "Id"
    )

    val rightDataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Description" -> "This is row1"),
      "row2" -> Map("Id" -> "row2", "Description" -> "This is row2"),
      "row3" -> Map("Id" -> "row3", "Description" -> "This is row3"),
    ))
    val rightProviderFactory = (table: DataTable, _: IVuuServer) => testProviderFactory.create(table, rightDataSource)

    val joinTableFunc: TableDefContainer => JoinTableDef = _ => JoinTableDef(
      name = joinTableName,
      baseTable = leftTableDef,
      joinColumns = Columns.allFrom(leftTableDef),
      joins =
        JoinTo(
          table = rightTableDef,
          joinSpec = JoinSpec(left = "Id", right = "Id", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq()
    )

    ModuleFactory.withNamespace(moduleName)
      //.addTableForTest(tableDef1, providerFactory)
      //.addTableForTest(tableDef2, providerFactory)
      //.addTableForTest(tableDef3, providerFactory)
      //.addTableForTest(tableDef4, providerFactory)
      .addTableForTest(leftTableDef, leftProviderFactory)
      .addTableForTest(rightTableDef, rightProviderFactory)
      .addJoinTableForTest(joinTableFunc)
      .asModule()
  }

  private def createViewPort(tableName: String) = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(1, 100), columns = Array("Id", "Name", "Account"))
    vuuClient.send(sessionId, tokenId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    // Verify viewport keys are populated. viewPortRunner cycle is 100ms
    val tableSizeResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
    tableSizeResponse.get.rows(0).vpSize shouldEqual 3
    viewPortId
  }

  private def updateTable(tableName: String): Unit = {
    val lastHour: Long = timeProvider.now() - 3600000
    val nextHour: Long = timeProvider.now() + 3600000
    val newDataSource = new FakeDataSource(ListMap(
      "row3" -> Map("Id" -> "row3", "Name" -> "New Name", "Account" -> 789, CreatedTimeColumnName -> lastHour), // update an existing row
      "row4" -> Map("Id" -> "row4", "Name" -> "Tom Thatcher", "Account" -> 134, CreatedTimeColumnName -> nextHour), // add a new row
    ))
    testProviderFactory.getProvider(tableName).update(newDataSource)
  }

  private def addNewRow(tableName: String): Unit = {
    val nextHour: Long = timeProvider.now() + 3600000
    val newDataSource = new FakeDataSource(ListMap(
      "row4" -> Map("Id" -> "row4", "Name" -> "Tom Thatcher", CreatedTimeColumnName -> nextHour), // add a new row
    ))
    testProviderFactory.getProvider(tableName).update(newDataSource)
  }

/*  private def updateJoinTable(): Unit = {
    val nextHour: Long = timeProvider.now() + 3600000
    val newDataSource = new FakeDataSource(ListMap(
      "row5" -> Map("Id" -> "row5", "Name" -> "Charlie Hunnam", "Account" -> 145, CreatedTimeColumnName -> nextHour), // add a new row
    ))
    testProviderFactory.getProvider(leftTableName).update(newDataSource)

    val newDataSource2 = new FakeDataSource(ListMap(
      "row4" -> Map("Id" -> "row4", "Description" -> "This is row4", CreatedTimeColumnName -> nextHour), // add a new row
      "row5" -> Map("Id" -> "row5", "Description" -> "This is row5", CreatedTimeColumnName -> nextHour), // add a new row
    ))
    testProviderFactory.getProvider(rightTableName).update(newDataSource2)
  }*/

}