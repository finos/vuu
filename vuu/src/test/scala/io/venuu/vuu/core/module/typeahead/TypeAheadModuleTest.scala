package io.venuu.vuu.core.module.typeahead

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, TestFriendlyClock}
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.table.{Columns, RowWithData, TableContainer}
import io.venuu.vuu.net.{ClientSessionId, JsonViewServerMessage, RequestContext, RpcCall, RpcResponse, ViewServerMessage}
import io.venuu.vuu.provider.VuuJoinTableProvider
import io.venuu.vuu.viewport.TestTimeStamp.EPOCH_DEFAULT
import io.venuu.vuu.viewport.ViewPortTable
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class TypeAheadModuleTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  def toVsMsg(body: RpcCall): ViewServerMessage = {
    JsonViewServerMessage("REQ:123", "SESS:456", "AAA", "chris", body)
  }

  def callGetUniqueFieldValues(tables: TableContainer, column: String): Array[String] = {

    val typeAheadRpc = new TypeAheadRpcHandlerImpl(tables)

    val ctx = RequestContext("", ClientSessionId("",""), null, null, "")

    val vsMsg = toVsMsg(RpcCall("TypeAheadRpcHandler", "getUniqueFieldValues", Array(Map("table" -> "orders", "module" -> "TEST"), column), Map()))

    val response = typeAheadRpc.processRpcCall(vsMsg, vsMsg.body.asInstanceOf[RpcCall])(ctx)

    response.get.body.asInstanceOf[RpcResponse].result.asInstanceOf[Array[String]]
  }

  def callGetUniqueFieldValuesStarting(tables: TableContainer, column: String, starts: String): Array[String] = {

    val typeAheadRpc = new TypeAheadRpcHandlerImpl(tables)

    val ctx = new RequestContext("", ClientSessionId("",""), null, null, "")

    val vsMsg = toVsMsg(RpcCall("TypeAheadRpcHandler", "getUniqueFieldValuesStartingWith", Array(Map("table" -> "orders", "module" -> "TEST"), column, starts), Map()))

    val response = typeAheadRpc.processRpcCall(vsMsg, vsMsg.body.asInstanceOf[RpcCall])(ctx)

    response.get.body.asInstanceOf[RpcResponse].result.asInstanceOf[Array[String]]
  }

  def setup(): TableContainer = {

    implicit val clock: Clock = new TestFriendlyClock(1000001L)
    implicit val lifeCycle: LifecycleContainer = new LifecycleContainer()
    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    val joinProvider = new VuuJoinTableProvider()

    val tables = new TableContainer(joinProvider)

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields =  "ric", "orderId"
    )

    val ordersTable = tables.createTable(ordersDef)

    ordersTable.processUpdate("NYC-0008", RowWithData("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "BT.L")), EPOCH_DEFAULT)
    ordersTable.processUpdate("NYC-0009", RowWithData("NYC-0009", Map("orderId" -> "NYC-0009", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "BT.L")), EPOCH_DEFAULT)
    ordersTable.processUpdate("NYC-0010", RowWithData("NYC-0010", Map("orderId" -> "NYC-0010", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "VOD.L")), EPOCH_DEFAULT)

    tables
  }

  Scenario("Test Type Ahead Module RPC"){

    val tables = setup()

    callGetUniqueFieldValues(tables, "orderId") should equal(Array("NYC-0008", "NYC-0009", "NYC-0010"))
    callGetUniqueFieldValues(tables, "ric") should equal(Array("BT.L", "VOD.L"))
    callGetUniqueFieldValues(tables, "foobar") should equal(Array())

    callGetUniqueFieldValuesStarting(tables, "orderId", "NYC" )should equal(Array("NYC-0008", "NYC-0009", "NYC-0010"))
    callGetUniqueFieldValuesStarting(tables, "ric", "B") should equal(Array("BT.L"))
  }
}
