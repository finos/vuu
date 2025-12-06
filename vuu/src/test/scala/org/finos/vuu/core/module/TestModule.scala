package org.finos.vuu.core.module

import org.finos.vuu.api.{TableDef, ViewPortDef}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.net.{ClientSessionId, MessageBody, RequestContext}
import org.finos.vuu.provider.MockProvider
import org.finos.vuu.viewport._
import org.finos.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import org.finos.toolbox.time.Clock

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

object TestModule{

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
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
        (table, provider, _, _) => ViewPortDef(
            columns = table.getTableDef.getColumns,
            service = new MyCustomRpcHandler
          )
        )
      .asModule()
  }
}


