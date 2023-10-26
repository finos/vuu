package org.finos.vuu.core.table.join.modules

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleFactory, MyCustomRpcHandler, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.provider.MockProvider

object PriceTestModule{

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    ModuleFactory.withNamespace("PriceTest")
      .addTable(
        TableDef(
          name = "prices",
          keyField = "ric",
          columns = Columns.fromNames("ric:String", "bid:long", "offer:long"),
          joinFields = "ric"
        )
        ,
        (table, vs) => new MockProvider(table)
      )
      .asModule()
  }
}
