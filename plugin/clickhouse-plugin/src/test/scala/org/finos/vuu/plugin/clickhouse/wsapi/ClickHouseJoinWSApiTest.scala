package org.finos.vuu.plugin.clickhouse.wsapi

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.vuu.core.VuuServerConfig
import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.net.{ChangeViewPortRange, ChangeViewPortRangeSuccess, CreateViewPortRequest, CreateViewPortSuccess, GetTableMetaRequest, GetTableMetaResponse}
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule.{NAME, ORDER_INSTRUMENTS_JOIN_TABLE_NAME}
import org.finos.vuu.plugin.clickhouse.util.ClickhouseJoinDataCreator
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.WebSocketApiTestBase
import org.finos.vuu.wsapi.helpers.{TestStartUp, TestVuuClient}

class ClickHouseJoinWSApiTest extends WebSocketApiTestBase with ForAllTestContainer {

  override val container: ClickHouseContainer = ClickHouseContainer()

  override def afterStart(): Unit = {
    ClickhouseJoinDataCreator.createTables(container, 100, 1_000_000)
  }

  Feature("[Web Socket API] Test ClickHouse join table operations") {

    Scenario("Get table metadata") {

      Given(s"an existing table $ORDER_INSTRUMENTS_JOIN_TABLE_NAME in module $NAME")

      When("a user requests table metadata")
      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable(ORDER_INSTRUMENTS_JOIN_TABLE_NAME, NAME)))

      Then("return view port columns and other data in the response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[GetTableMetaResponse](response)
      responseBody.columns.length shouldEqual 11
      responseBody.columns shouldEqual Array("orderId", "instrumentId", "quantity", "price", "side", "trader", "currency", "time", "ric", "exchange", "instrumentCurrency")
      responseBody.editableColumns shouldEqual Array[String]()
      responseBody.maxRangeEnd shouldEqual 1_000_000
      responseBody.maxRangeWidth shouldEqual 1_000
    }

    Scenario("Open viewport and get joined data") {
      Given(s"an open viewport on table $ORDER_INSTRUMENTS_JOIN_TABLE_NAME in module $NAME")
      val viewPortId = createViewPort(ORDER_INSTRUMENTS_JOIN_TABLE_NAME)

      And(s"we make a change to the range to trigger more data")
      val rangeRequest = ChangeViewPortRange(viewPortId, 5, 15)
      vuuClient.send(sessionId, rangeRequest)
      vuuClient.awaitForMsgWithBody[ChangeViewPortRangeSuccess]

      Then("We should get 5 row updates")
      waitForData(viewPortId, 5)
    }

  }

  override def testStartUp(): (TestVuuClient, VuuServerConfig) = {
    val startUp = new TestStartUp(() => defineModuleWithTestTables(), () => VirtualizedTablePlugin)
    startUp.startServerAndClient()
  }

  protected def defineModuleWithTestTables(): ViewServerModule = {
    val client = ClickHouseClient(ClickHouseClientOptions()
      .withEndpoint(container.getEndpoint)
      .withUsername(container.getDefaultUsername)
      .withPassword(container.getDefaultPassword))

    ClickHouseTableModule(client)
  }

  private def createViewPort(tableName: String): String = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, NAME), ViewPortRange(0, 10), Array("*"))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(viewPortId, 10)
    viewPortId
  }

}
