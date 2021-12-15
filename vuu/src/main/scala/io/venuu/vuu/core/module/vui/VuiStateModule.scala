package io.venuu.vuu.core.module.vui

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.{TableDef, VisualLinks}
import io.venuu.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import io.venuu.vuu.core.table.Columns
import io.venuu.vuu.state.VuiStateStore

object VuiStateModule extends DefaultModule {

  final val NAME = "vui"

  def apply(store: VuiStateStore)(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {

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
