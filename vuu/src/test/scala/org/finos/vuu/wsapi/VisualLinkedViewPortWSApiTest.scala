package org.finos.vuu.wsapi

import org.finos.vuu.api.*
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.net.*
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProviderFactory}

import scala.collection.immutable.ListMap

class VisualLinkedViewPortWSApiTest extends WebSocketApiTestBase {
  private val tableName1 = "RequestTable"
  private val moduleName = "VLVPTEST"
  private val testProviderFactory = new TestProviderFactory

  Feature("[Web Socket API] Visual linked view ports") {

    Scenario("Create a visual link of view ports") {
      Given("Parent and child view ports exist")
      val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName1, moduleName), ViewPortRange(0, 100), columns = Array("requestRefId", "parentRequestRefId", "orderId"))
      vuuClient.send(sessionId, createViewPortRequest)
      val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
      val childVpId = viewPortCreateResponse.get.viewPortId
      waitForData(3)

      val createViewPortRequest2 = CreateViewPortRequest(ViewPortTable(tableName1, moduleName), ViewPortRange(0, 100), columns = Array("requestRefId", "parentRequestRefId", "orderId"))
      vuuClient.send(sessionId, createViewPortRequest2)
      val viewPortCreateResponse2 = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
      val parentVpId = viewPortCreateResponse2.get.viewPortId
      waitForData(3)

      When("Link the view ports on column parentRequestRefId")
      val request = CreateVisualLinkRequest(childVpId, parentVpId, "parentRequestRefId", "parentRequestRefId")
      val requestId = vuuClient.send(sessionId, request)

      Then("view port is linked")
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[CreateVisualLinkSuccess](response)

      Then("select a row on parent view port")
      val selectRequest = SelectRowRequest(parentVpId, "req1", false)
      val requestId2 = vuuClient.send(sessionId, selectRequest)
      val response2 = vuuClient.awaitForResponse(requestId2)
      val responseBody2 = assertBodyIsInstanceOf[SelectRowSuccess](response2)

      val vpToSize: Map[String, Int] = Map(parentVpId -> 3, childVpId -> 2)

      Then("First view port should show filtered rows")
      val tableRowUpdatesResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
      val viewPortId = tableRowUpdatesResponse.get.rows(0).viewPortId
      tableRowUpdatesResponse.get.rows(0).vpSize shouldEqual vpToSize(viewPortId)

      val remaining = vpToSize.removed(viewPortId)

      Then("Second view port should show filtered rows")
      val tableRowUpdatesResponse2 = vuuClient.awaitForMsgWithBody[TableRowUpdates]
      val viewPortId2 = tableRowUpdatesResponse2.get.rows(0).viewPortId
      tableRowUpdatesResponse2.get.rows(0).vpSize shouldEqual remaining(viewPortId2)
    }
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val lastHour: Long = timeProvider.now() - 3600000
    val dataSource = new FakeDataSource(ListMap(
      "req1" -> Map("requestRefId" -> "req1", "parentRequestRefId" -> "parent1", "orderId" -> 111),
      "req2" -> Map("requestRefId" -> "req2", "parentRequestRefId" -> "parent1", "orderId" -> 222),
      "req3" -> Map("requestRefId" -> "req3", "parentRequestRefId" -> "parent2", "orderId" -> 333),
    ))
    val providerFactory = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, dataSource)

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(TableDef(
        name = tableName1,
        keyField = "Id",
        columns =
          new ColumnBuilder()
            .addString("requestRefId")
            .addString("parentRequestRefId")
            .addInt("orderId")
            .build(),
        links = VisualLinks(
          Link("requestRefId", tableName1, "requestRefId")
        ),
      ), providerFactory)
      .asModule()
  }

}