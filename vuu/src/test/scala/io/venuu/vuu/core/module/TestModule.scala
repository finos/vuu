package io.venuu.vuu.core.module

import io.venuu.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.{TableDef, ViewPortDef}
import io.venuu.vuu.core.table.Columns
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.net.{ClientSessionId, MessageBody, RequestContext}
import io.venuu.vuu.provider.MockProvider
import io.venuu.vuu.viewport._

case class MyObjectParam(foo: String, bar: String) extends MessageBody

trait AnRpcHandler{
  def onSendToMarket(param1: Map[String , Any], ctx: RequestContext): Boolean
}

class MyCustomRpcHandler extends DefaultLifecycleEnabled with AnRpcHandler with RpcHandler {
  def onSendToMarket(param1: Map[String , Any], ctx: RequestContext): Boolean = {
    println("doing something false ." + param1)
    false
  }

  def testSel(selection: ViewPortSelection,sessionId: ClientSessionId) : ViewPortAction = {
    NoAction()
  }

  override def menuItems(): ViewPortMenu = {
    ViewPortMenu(
      ViewPortMenu("Test Menu",
        new SelectionViewPortMenuItem("Test Selection", "", this.testSel, "TEST_SEL")
      ),
    )
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
        ,
        (table, vs) => new MockProvider(table),
        (table, provider, _) => ViewPortDef(
            columns = table.getTableDef.columns,
            service = new MyCustomRpcHandler
          )
        )
      .addRpcHandler(vs => new MyCustomRpcHandler)
      .asModule()
  }
}


