package org.finos.vuu.plugin.clickhouse.wsapi

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.vuu.core.VuuServerConfig
import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.net.{CreateViewPortRequest, CreateViewPortSuccess, GetTableMetaRequest, GetTableMetaResponse}
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule.{NAME, TABLE_NAME}
import org.finos.vuu.plugin.clickhouse.util.ClickHouseOrderCreator
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.WebSocketApiTestBase
import org.finos.vuu.wsapi.helpers.{TestStartUp, TestVuuClient}

class ClickHouseWSApiTest extends WebSocketApiTestBase with ForAllTestContainer {

  override val container: ClickHouseContainer = ClickHouseContainer()

  override def afterStart(): Unit = {
    ClickHouseOrderCreator.createOrderData(container, 50_000)
  }
  
  Feature("[Web Socket API] Test ClickHouse table operations") {

    Scenario("Get table metadata") {

      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable(TABLE_NAME, NAME)))

      Then("return view port columns in response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[GetTableMetaResponse](response)
      responseBody.columns.length shouldEqual 5
      responseBody.columns shouldEqual Array("orderId", "quantity", "price", "side", "trader")
      responseBody.editableColumns shouldEqual Array[String]()
      responseBody.maxRangeEnd shouldEqual 1_000_000
      responseBody.maxRangeWidth shouldEqual 1_000
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
    waitForData(10)
    viewPortId
  }

}
