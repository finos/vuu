package io.venuu.vuu.core.module.metrics

import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.{Indices, TableDef}
import io.venuu.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import io.venuu.vuu.core.table.Columns

object MetricsModule extends DefaultModule {

  final val NAME = "METRICS"

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer, metrics: MetricsProvider): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
            name = "metrics",
            keyField = "table",
            columns = Columns.fromNames("table".string(), "size".long(), "updateCount".long(), "updatesPerSecond".long()),
            indices = Indices(),
            joinFields = "table"
          ),
        (table, vs) => new MetricsTableProvider(table, vs.tableContainer)
      )
      .asModule()
  }

}
