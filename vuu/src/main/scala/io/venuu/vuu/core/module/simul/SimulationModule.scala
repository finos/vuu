/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 07/09/2016.
  *
  */
package io.venuu.vuu.core.module.simul

import io.venuu.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.api._
import io.venuu.vuu.core.module.simul.provider.OrdersSimulProvider
import io.venuu.vuu.core.module.{ViewServerModule, ViewServerModuleBuilder}
import io.venuu.vuu.core.table.Columns
import io.venuu.vuu.net.RequestContext
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.RpcProvider
import io.venuu.vuu.provider.simulation.{SimulatedBigInstrumentsProvider, SimulatedPricesProvider}


trait SimulRpcHandler{
  def onSendToMarket(param1: Map[String , Any])(ctx: RequestContext): Boolean

}

class TheSimulRpcHander extends DefaultLifecycleEnabled with RpcHandler with SimulRpcHandler{
  def onSendToMarket(param1: Map[String , Any])(ctx: RequestContext): Boolean = {
    println("doing something false ." + param1)
    false
  }
}


object SimulationModule {

  final val NAME = "SIMUL"

  def apply()(implicit time: TimeProvider, lifecycle: LifecycleContainer): ViewServerModule = {

    val instrumentDef = TableDef(
      name = "instruments",
      keyField = "ric",
      columns = Columns.fromNames("ric:String", "description:String", "currency: String", "exchange:String", "lotSize:Double"),
      joinFields = "ric"
    )

    val pricesDef = AutoSubscribeTableDef(
      name = "prices",
      keyField = "ric",
      Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "scenario: String"),
      joinFields = "ric"
    )

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      Columns.fromNames("orderId:String", "side:Char", "ric:String", "ccy:String", "quantity:Double", "trader:String", "filledQuantity:Double", "lastUpdate: Long", "created: Long"),
      joinFields = "orderId", "ric"
    )

    val orderEntryDef = TableDef("orderEntry", "clOrderId",
      Columns.fromNames("clOrderId:String", "ric:String", "quantity: Double", "orderType:String", "price: Double", "priceLevel: String"), "ric"
    )

    val instrumentPrices = JoinTableDef(
      name = "instrumentPrices",
      baseTable = instrumentDef,
      joinColumns = Columns.allFrom(instrumentDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      joinFields = Seq()
    )

    val orderPrices = JoinTableDef(
      name = "ordersPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      joinFields = Seq()
    )

    ViewServerModuleBuilder(NAME)

      .addTableDef(
        instrumentDef,
        pricesDef,
        instrumentPrices,
        ordersDef,
        orderPrices,
        orderEntryDef
      )
      .setRpcHandler(new TheSimulRpcHander)

      .setProvidersCallback(table => {
            table.name match {
              case "instruments" => new SimulatedBigInstrumentsProvider(table)
              case "prices" => new SimulatedPricesProvider(table, maxSleep = 800)
              case "orderEntry" => new RpcProvider(table)
              case "orders" => new OrdersSimulProvider(table)
            }
    })
  }
}
