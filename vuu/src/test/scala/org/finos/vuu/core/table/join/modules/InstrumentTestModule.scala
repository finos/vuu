package org.finos.vuu.core.table.join.modules

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.provider.MockProvider

object InstrumentTestModule {

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    ModuleFactory.withNamespace("InstrumentTest")
      .addTable(
        TableDef(
          name = "instruments",
          keyField = "ric",
          columns = Columns.fromNames("ric:String", "description:String", "isin:String"),
          joinFields = "ric"
        )
        ,
        (table, vs) => new MockProvider(table)
      )
      .asModule()
  }
}
