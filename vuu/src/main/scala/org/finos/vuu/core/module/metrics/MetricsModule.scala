package org.finos.vuu.core.module.metrics

import org.finos.vuu.api.{Indices, TableDef}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.metrics.MetricsSchema.MetricsTree.all_columns

object MetricsSchema{

  object ViewPortParallelism{
    final val work_ms_in_1m = "work_ms_in_1m"
    final val work_par_ratio = "work_par_ratio"
  }

  object MetricsTree{
    val id: String = "id"
    val table: String = "table"
    val realTable: String = "realTable"

    val build_mean: String = "build_mean"
    val build_samples: String = "build_samples"
    val build_50_perc: String = "build_50_perc"
    val build_75_perc: String = "build_75_perc"
    val build_99_perc: String = "build_99_perc"
    val build_99_9_perc: String = "build_99_9_perc"

    val build_columns: List[String] = List(build_mean, build_samples, build_50_perc, build_75_perc, build_99_perc, build_99_9_perc)

    val tokeys_mean: String = "tokeys_mean"
    val tokeys_samples: String = "tokeys_samples"
    val tokeys_50_perc: String = "tokeys_50_perc"
    val tokeys_75_perc: String = "tokeys_75_perc"
    val tokeys_99_perc: String = "tokeys_99_perc"
    val tokeys_99_9_perc: String = "tokeys_99_9_perc"

    val tokeys_columns: List[String] = List(tokeys_mean, tokeys_samples, tokeys_50_perc, tokeys_75_perc, tokeys_99_perc, tokeys_99_9_perc)

    val setkeys_mean : String= "setkeys_mean"
    val setkeys_samples: String = "setkeys_samples"
    val setkeys_50_perc : String= "setkeys_50_perc"
    val setkeys_75_perc: String = "setkeys_75_perc"
    val setkeys_99_perc: String = "setkeys_99_perc"
    val setkeys_99_9_perc: String = "setkeys_99_9_perc"

    val setkeys_columns: List[String] = List(setkeys_mean, setkeys_samples, setkeys_50_perc, setkeys_75_perc, setkeys_99_perc, setkeys_99_9_perc)

    val settree_mean: String= "settree_mean"
    val settree_samples: String = "settree_samples"
    val settree_50_perc: String = "settree_50_perc"
    val settree_75_perc: String = "settree_75_perc"
    val settree_99_perc: String = "settree_99_perc"
    val settree_99_9_perc: String = "settree_99_9_perc"

    val settree_columns: List[String] = List(settree_mean, settree_samples, settree_50_perc, settree_75_perc, settree_99_perc, settree_99_9_perc)

    val diff_branches_mean: String = "diff_branches_mean"
    val diff_branches_samples: String = "diff_branches_samples"
    val diff_branches_50_perc: String = "diff_branches_50_perc"
    val diff_branches_75_perc: String = "diff_branches_75_perc"
    val diff_branches_99_perc: String = "diff_branches_99_perc"
    val diff_branches_99_9_perc: String = "diff_branches_99_9_perc"

    val diff_branches_columns: List[String] = List(diff_branches_mean, diff_branches_samples, diff_branches_50_perc, diff_branches_75_perc, diff_branches_99_perc, diff_branches_99_9_perc)

    val all_columns: List[String] = build_columns ++ tokeys_columns ++ setkeys_columns ++ settree_columns ++ diff_branches_columns

  }

}

object MetricsModule extends DefaultModule {

  final val NAME = "METRICS"

  def apply()(implicit time: Clock, lifecycle: LifecycleContainer, metrics: MetricsProvider, tableDefContainer: TableDefContainer): ViewServerModule = {

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
          name = "metricsTree",
          keyField = "id",
          columns = Columns.fromNames("id".string(), "table".string(), "realTable".string()) ++ Columns.fromNames(all_columns.map(name => name + ":Double").toArray),
          indices = Indices(),
          joinFields = "id"
        ),
        (table, vs) => new MetricsGroupByProvider(table, vs.viewPortContainer)
      )
      .addTable(
        TableDef(
          name = "metricsJVM",
          keyField = "mem-type",
          columns = Columns.fromNames("mem-type".string(), "max_MB".double(), "committed_MB".double(), "init_MB".double(), "used_MB".double(), "cpu-cores".int()),
          indices = Indices(),
          joinFields = "mem-type"
        ),
        (table, vs) => new MetricsJVMProvider(table, vs.viewPortContainer)
      )
      .addTable(
        TableDef(
          name = "metricsViewPortWork",
          keyField = "type",
          columns = Columns.fromNames("type".string(), "work_ms_in_1m".double(), "work_par_ratio".double()),
          indices = Indices(),
          joinFields = "type"
        ),
        (table, vs) => new MetricsViewPortParallelismProvider(table, vs.viewPortContainer)
      )
      .asModule()
  }

}
