package org.finos.vuu.core.module.typeahead

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{Columns, RowWithData, TableContainer}
import org.finos.vuu.net._
import org.finos.vuu.provider.VuuJoinTableProvider
import org.finos.vuu.viewport.TestTimeStamp.EPOCH_DEFAULT
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

@deprecated("TypeAheadModule is replaced by ViewportTypeAheadRpcHandler")
class TypeAheadModuleTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  def toVsMsg(body: RpcCall): ViewServerMessage = {
    JsonViewServerMessage("REQ:123", "SESS:456", "AAA", "chris", body)
  }

  def callGetUniqueFieldValues(tables: TableContainer, column: String): Array[String] = {

    val typeAheadRpc = new GenericTypeAheadRpcHandler(tables)

    val ctx = RequestContext("", ClientSessionId("", ""), null, "")

    val vsMsg = toVsMsg(RpcCall("TypeAheadRpcHandler", "getUniqueFieldValues", Array(Map("table" -> "orders", "module" -> "TEST"), column), Map()))

    val response = typeAheadRpc.processRpcCall(vsMsg, vsMsg.body.asInstanceOf[RpcCall])(ctx)

    response.get.body.asInstanceOf[RpcResponse].result.asInstanceOf[Array[String]]
  }

  def callGetUniqueFieldValuesStarting(tables: TableContainer, column: String, starts: String): Array[String] = {

    val typeAheadRpc = new GenericTypeAheadRpcHandler(tables)

    val ctx = new RequestContext("", ClientSessionId("", ""), null, "")

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

    ordersTable.processUpdate("NYC-0008", RowWithData("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "BT.L")))
    ordersTable.processUpdate("NYC-0009", RowWithData("NYC-0009", Map("orderId" -> "NYC-0009", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "BT.L")))
    ordersTable.processUpdate("NYC-0010", RowWithData("NYC-0010", Map("orderId" -> "NYC-0010", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "VOD.L")))

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
