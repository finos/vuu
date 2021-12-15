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
          name = "metricsTables",
          keyField = "table",
          columns = Columns.fromNames("table".string(), "size".long(), "updateCount".long(), "updatesPerSecond".long()),
          indices = Indices(),
          joinFields = "table"
        ),
        (table, vs) => new MetricsTableProvider(table, vs.tableContainer)
      )
      .addTable(
        TableDef(
          name = "metricsViewports",
          keyField = "id",
          columns = Columns.fromNames("id".string(), "table".string(), "mean".long(), "max".long(), "75Perc".long(), "99Perc".long(), "99_9Perc".long()),
          indices = Indices(),
          joinFields = "id"
        ),
        (table, vs) => new MetricsViewPortProvider(table, vs.viewPortContainer)
      )
      .addTable(
        TableDef(
          name = "metricsGroupBy",
          keyField = "id",
          columns = Columns.fromNames("id".string(), "table".string(), "mean".long(), "max".long(), "75Perc".long(), "99Perc".long(), "99_9Perc".long()),
          indices = Indices(),
          joinFields = "id"
        ),
        (table, vs) => new MetricsGroupByProvider(table, vs.viewPortContainer)
      )
      .asModule()
  }

}
