package io.venuu.vuu.core.module

import io.venuu.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.table.Columns
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.net.{MessageBody, RequestContext}
import io.venuu.vuu.provider.MockProvider

case class MyObjectParam(foo: String, bar: String) extends MessageBody

trait AnRpcHandler{
  def onSendToMarket(param1: Map[String , Any])(context: RequestContext): Boolean
}

class MyCustomRpcHandler extends DefaultLifecycleEnabled with RpcHandler with AnRpcHandler{
  def onSendToMarket(param1: Map[String , Any])(context: RequestContext): Boolean = {
    println("doing something false ." + param1)
    false
  }
}

/**
  * Created by chris on 29/08/2016.
  */
object TestModule{

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    ModuleFactory.withNamespace("TEST")
        .addTable(
          TableDef(
            name = "instruments",
            keyField = "ric",
            columns = Columns.fromNames("ric:String", "description:String", "currency: String", "exchange:String", "lotSize:Double"),
            joinFields = "ric"
          )
        , (table, vs) => new MockProvider(table)
        )
      .addRpcHandler(vs => new MyCustomRpcHandler)
      .asModule()
  }
}


