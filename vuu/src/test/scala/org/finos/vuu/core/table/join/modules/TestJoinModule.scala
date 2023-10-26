package org.finos.vuu.core.table.join.modules

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef}
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.provider.MockProvider

object TestJoinModule {

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    ModuleFactory.withNamespace("JoinTest")
      .addJoinTable( tableDefs =>
        JoinTableDef(
          name = "InstrumentPrices",
          baseTable = tableDefs.get("instrument"),
          joinColumns = Columns.allFrom(tableDefs.get("instrument")) ++ Columns.allFromExcept(tableDefs.get("prices"), "ric"),
          joins =
            JoinTo(
              table = tableDefs.get("prices"),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          joinFields = Seq()
        )
      ).asModule()
  }
}
