package org.finos.vuu.core.module.modulefrommodule

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, VisualLinks}
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns

object JoinModule {

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    import org.finos.vuu.core.module.modulefrommodule.{InstrumentModule => Instrument, PriceModule => Price}

    ModuleFactory.withNamespace("JOIN")
      .addJoinTable(
        tableDefs =>
          JoinTableDef(
            name = "instrumentPrice",
            baseTable = tableDefs.get(Instrument.NAME, "instrument"),
            joinColumns = Columns.allFromExceptDefaultColumns(tableDefs.get(Instrument.NAME, "instrument")) ++ Columns.allFromExcept(tableDefs.get(Price.NAME, "price"), "ric"),
            joins =
              JoinTo(
                table = tableDefs.get(Price.NAME, "price"),
                joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
              ),
            links = VisualLinks(),
            joinFields = Seq()
          ))
      .asModule()
  }


}
