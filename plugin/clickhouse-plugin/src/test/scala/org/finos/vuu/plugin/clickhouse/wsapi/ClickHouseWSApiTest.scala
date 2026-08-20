package org.finos.vuu.plugin.clickhouse.wsapi

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.vuu.core.VuuServerConfig
import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.net.rpc.{RpcNames, RpcSuccessResult, ViewPortContext}
import org.finos.vuu.net.ui.NoneAction
import org.finos.vuu.net.{CreateViewPortRequest, CreateViewPortSuccess, GetTableMetaRequest, GetTableMetaResponse, RpcRequest, RpcResponseNew}
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule
import org.finos.vuu.plugin.clickhouse.module.ClickHouseTableModule.{NAME, NO_SELL_TABLE_NAME, TABLE_NAME}
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

      Given(s"an existing table $TABLE_NAME in module $NAME")

      When("a user requests table metadata")
      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable(TABLE_NAME, NAME)))

      Then("return view port columns and other data in the response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[GetTableMetaResponse](response)
      responseBody.columns.length shouldEqual 6
      responseBody.columns shouldEqual Array("orderId", "quantity", "price", "side", "trader", "time")
      responseBody.editableColumns shouldEqual Array[String]()
      responseBody.maxRangeEnd shouldEqual 1_000_000
      responseBody.maxRangeWidth shouldEqual 1_000
    }

    Scenario("Open viewport and get unique values") {

      Given(s"an open viewport on table $TABLE_NAME in module $NAME")
      val viewPortId = createViewPort(TABLE_NAME)

      When("a user requests type ahead on a column")
      val typeAheadRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.UniqueFieldValuesRpc,
        params = Map(
          "column" -> "trader"
        ))
      val requestId = vuuClient.send(sessionId, typeAheadRequest)
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual  RpcNames.UniqueFieldValuesRpc

      Then("return a list of the first ten options, alphabetically")
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("trader-1", "trader-10", "trader-100", "trader-1000", "trader-10000",
        "trader-10001", "trader-10002", "trader-10003", "trader-10004", "trader-10005")

      And("return NoneAction")
      responseBody.action shouldEqual NoneAction
    }

    Scenario("Open viewport on a table with a permission filter and get unique values") {

      Given(s"an open viewport on table $NO_SELL_TABLE_NAME in module $NAME")
      val viewPortId = createViewPort(NO_SELL_TABLE_NAME)

      When("a user requests type ahead on a column")
      val typeAheadRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.UniqueFieldValuesRpc,
        params = Map(
          "column" -> "trader"
        ))
      val requestId = vuuClient.send(sessionId, typeAheadRequest)
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.UniqueFieldValuesRpc

      Then("return a list of the first ten options, alphabetically")
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("trader-10", "trader-100", "trader-1000", "trader-10000", "trader-10002",
        "trader-10004", "trader-10006", "trader-10008", "trader-10010", "trader-10012")

      And("return NoneAction")
      responseBody.action shouldEqual NoneAction
    }

    Scenario("Open viewport on a table and get unique values starting with") {

      Given(s"an open viewport on table $TABLE_NAME in module $NAME")
      val viewPortId = createViewPort(TABLE_NAME)

      When("a user requests type ahead on a column")
      val typeAheadRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.UniqueFieldValuesStartWithRpc,
        params = Map(
          "column" -> "trader",
          "starts" -> "trader-9"
        ))
      val requestId = vuuClient.send(sessionId, typeAheadRequest)
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.UniqueFieldValuesStartWithRpc

      Then("return a list of the first ten options, alphabetically")
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("trader-9", "trader-90", "trader-900", "trader-9000", "trader-9001",
        "trader-9002", "trader-9003", "trader-9004", "trader-9005", "trader-9006")

      And("return NoneAction")
      responseBody.action shouldEqual NoneAction
    }

    Scenario("Open viewport on a table with a permission filter and get unique values starting with") {

      Given(s"an open viewport on table $NO_SELL_TABLE_NAME in module $NAME")
      val viewPortId = createViewPort(NO_SELL_TABLE_NAME)

      When("a user requests type ahead on a column")
      val typeAheadRequest = RpcRequest(
        ViewPortContext(viewPortId),
        RpcNames.UniqueFieldValuesStartWithRpc,
        params = Map(
          "column" -> "trader",
          "starts" -> "trader-9"
        ))
      val requestId = vuuClient.send(sessionId, typeAheadRequest)
      val response = vuuClient.awaitForResponse(requestId)
      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual RpcNames.UniqueFieldValuesStartWithRpc

      Then("return a list of the first ten options, alphabetically")
      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("trader-90", "trader-900", "trader-9000", "trader-9002", "trader-9004",
        "trader-9006", "trader-9008", "trader-9010", "trader-9012", "trader-9014")

      And("return NoneAction")
      responseBody.action shouldEqual NoneAction
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
