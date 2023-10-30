package org.finos.vuu.core.module.modulefrommodule

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleFactory, MyCustomRpcHandler, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.provider.MockProvider

object PriceModule {

  final val NAME = "PRICE"

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "price",
          keyField = "ric",
          columns = Columns.fromNames("ric:String", "bid:Long", "offer: long"),
          joinFields = "ric"
        )
        ,
        (table, vs) => new MockProvider(table)
      )
      .asModule()
  }

}
