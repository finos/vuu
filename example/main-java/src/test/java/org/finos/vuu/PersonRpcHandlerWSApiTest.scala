package org.finos.vuu

import org.finos.toolbox.time.DefaultClock
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.module.JavaExampleModule
import org.finos.vuu.net._
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.WebSocketApiTestBase

class PersonRpcHandlerWSApiTest extends WebSocketApiTestBase {

  private val tableName = "PersonManualMapped"
  private val moduleName = JavaExampleModule.NAME

  Feature("[Web Socket API] Person Rpc Test") {
    Scenario("Type ahead for a column") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request typeahead for Name column")
      val getTypeAheadRequest = createTypeAheadRequest(viewPortId, "PersonManualMapped", "Name")
      val requestId = vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return unique values in that column")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "getUniqueFieldValues"

      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual List("Adam", "Natalie")

      And("return No Action")
      responseBody.action shouldBe a[NoneAction]
    }

    Scenario("Custom Rpc request with a reference type as param") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request GetAccountId given the row key")
      val getTypeAheadRequest = RpcRequest(
        ViewPortContext(viewPortId),
        "GetAccountId",
        params = Map("rowKey" -> "uniqueId1"))
      val requestId = vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return account number for person with that id")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "GetAccountId"

      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)
      result.data shouldEqual 56440

      And("return No Action")
      responseBody.action shouldBe a[NoneAction]
    }

    Scenario("Custom Rpc request with object as params") {

      Given("a view port exist")
      val viewPortId: String = createViewPort

      When("request update name")
      val getTypeAheadRequest = RpcRequest(
        ViewPortContext(viewPortId),
        "UpdateName",
        params = Map("Id" -> "uniqueId1", "Name" -> "Chris"))
      val requestId = vuuClient.send(sessionId, tokenId, getTypeAheadRequest)

      Then("return success response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[RpcResponseNew](response)
      responseBody.rpcName shouldEqual "UpdateName"

      val result = assertAndCastAsInstanceOf[RpcSuccessResult](responseBody.result)

      And("return No Action")
      responseBody.action shouldBe a[NoneAction]

      And("return row update with new name")
    }
  }

  override protected def defineModuleWithTestTables(): ViewServerModule =
    new JavaExampleModule().create(new TableDefContainer(), new DefaultClock())


  private def createViewPort = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(1, 100), columns = Array("Id", "Name"))
    vuuClient.send(sessionId, tokenId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    viewPortId
  }


  private def createTypeAheadRequest(viewPortId: String, tableName: String, columnName: String): RpcRequest = {
    RpcRequest(
      ViewPortContext(viewPortId),
      RpcNames.UniqueFieldValuesRpc,
      params = Map(
        "table" -> tableName,
        "module" -> moduleName,
        "column" -> columnName
      ))
  }
}