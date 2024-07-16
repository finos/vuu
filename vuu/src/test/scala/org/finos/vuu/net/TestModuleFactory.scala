package org.finos.vuu.net

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef}
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.provider.MockProvider

object TestModuleFactory {
  def build(moduleName: String, tableDef: TableDef, viewPortDef: ViewPortDef)(implicit time: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule =
  ModuleFactory.withNamespace(moduleName)
      .addTable(
        tableDef,
        (table, _) => new MockProvider(table),
        (_, _, _, _) => viewPortDef
      )
      .asModule()
}
