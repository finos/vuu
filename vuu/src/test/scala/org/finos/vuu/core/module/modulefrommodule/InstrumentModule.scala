package org.finos.vuu.core.module.modulefrommodule

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleFactory, MyCustomRpcHandler, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.provider.MockProvider

object InstrumentModule {

  final val NAME = "INSTRUMENT"

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "instrument",
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
