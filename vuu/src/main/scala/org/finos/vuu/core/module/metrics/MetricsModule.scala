package org.finos.vuu.core.module.metrics

import org.finos.vuu.api.{Indices, TableDef}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

object  MetricsModule extends DefaultModule {

  final val NAME = "METRICS"

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer, metrics: MetricsProvider): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "metricsTables",
          keyField = "table",
          columns = Columns.fromNames("table".string(), "size".long(), "updateCount".long(), "updatesPerSecond".double()),
          indices = Indices(),
          joinFields = "table"
        ),
        (table, vs) => new MetricsTableProvider(table, vs.tableContainer)
      )
      .addTable(
        TableDef(
          name = "metricsViewports",
          keyField = "id",
          columns = Columns.fromNames("id".string(), "table".string(), "structureHash".int(), "updateCount".long(), "keyBuildCount".long(), "mean".double(), "max".double(), "75Perc".double(), "99Perc".double(), "99_9Perc".double()),
          indices = Indices(),
          joinFields = "id"
        ),
        (table, vs) => new MetricsViewPortProvider(table, vs.viewPortContainer)
      )
      .addTable(
        TableDef(
          name = "metricsGroupBy",
          keyField = "id",
          columns = Columns.fromNames("id".string(), "table".string(), "mean".double(), "max".double(), "75Perc".double(), "99Perc".double(), "99_9Perc".double()),
          indices = Indices(),
          joinFields = "id"
        ),
        (table, vs) => new MetricsGroupByProvider(table, vs.viewPortContainer)
      )
      .asModule()
  }

}
