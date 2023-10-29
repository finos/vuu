package org.finos.vuu.core.module.vui

import org.finos.vuu.api.{TableDef, VisualLinks}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.state.VuiStateStore
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

object VuiStateModule extends DefaultModule {

  final val NAME = "vui"

  def apply(store: VuiStateStore)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "uiState",
          keyField = "uniqueId",
          columns = Columns.fromNames("uniqueId".string(), "user".string(), "id".string(), "lastUpdate".long()),
          VisualLinks(),
        ),
        (table, vs) => new VuiStateStoreProvider(table, store)
      )
      .addRestService(_ => new VuiStateRestService(store))
      .asModule()
  }
}
