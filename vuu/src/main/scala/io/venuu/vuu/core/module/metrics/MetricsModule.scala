package io.venuu.vuu.core.module.metrics

import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.api.{AutoSubscribeTableDef, JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef}
import io.venuu.vuu.core.module.{ViewServerModule, ViewServerModuleBuilder}
import io.venuu.vuu.core.module.simul.TheSimulRpcHander
import io.venuu.vuu.core.module.simul.provider.OrdersSimulProvider
import io.venuu.vuu.core.table.{Columns, TableContainer}
import io.venuu.vuu.provider.RpcProvider
import io.venuu.vuu.provider.simulation.{SimulatedBigInstrumentsProvider, SimulatedPricesProvider}

object MetricsModule {

  final val NAME = "METRICS"

  def apply()(implicit time: TimeProvider, lifecycle: LifecycleContainer, metrics: MetricsProvider): ViewServerModule = {

    val metricsDef = TableDef(
      name = "metrics",
      keyField = "table",
      columns = Columns.fromNames("table:String", "size:Long", "updateCount:Long", "updatesPerSecond:Long"),
      joinFields = "table"
    )
//
//    val pricesDef = AutoSubscribeTableDef(
//      name = "prices",
//      keyField = "ric",
//      Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "scenario: String"),
//      joinFields = "ric"
//    )
//
//    val ordersDef = TableDef(
//      name = "orders",
//      keyField = "orderId",
//      Columns.fromNames("orderId:String", "side:Char", "ric:String", "ccy:String", "quantity:Double", "trader:String", "filledQuantity:Double", "lastUpdate: Long", "created: Long"),
//      joinFields = "orderId", "ric"
//    )
//
//    val orderEntryDef = TableDef("orderEntry", "clOrderId",
//      Columns.fromNames("clOrderId:String", "ric:String", "quantity: Double", "orderType:String", "price: Double", "priceLevel: String"), "ric"
//    )
//
//    val instrumentPrices = JoinTableDef(
//      name = "instrumentPrices",
//      baseTable = instrumentDef,
//      joinColumns = Columns.allFrom(instrumentDef) ++ Columns.allFromExcept(pricesDef, "ric"),
//      joins =
//        JoinTo(
//          table = pricesDef,
//          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
//        ),
//      joinFields = Seq()
//    )
//
//    val orderPrices = JoinTableDef(
//      name = "ordersPrices",
//      baseTable = ordersDef,
//      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
//      joins =
//        JoinTo(
//          table = pricesDef,
//          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
//        ),
//      joinFields = Seq()
//    )

    ViewServerModuleBuilder(NAME)

      .addTableDef(
        metricsDef
      )
      //.setRpcHandler(new TheSimulRpcHander)

      .setProvidersCallback((table, vs) => {
        table.name match {
          case "metrics" => new MetricsTableProvider(table, vs.tableContainer)
        }
      })
  }


}
