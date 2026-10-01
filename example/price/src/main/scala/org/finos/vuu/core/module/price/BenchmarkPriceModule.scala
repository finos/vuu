package org.finos.vuu.core.module.price

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, TableDefOptions, ViewPortDef}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{Columns, TableContainer}

/**
 * Standalone module for the vuu-ui perf benchmark (sample-apps/perf-benchmark).
 * Serves two fixed-size instrument tables, each backed by a
 * BenchmarkTickProvider that ticks the whole dataset at a controlled,
 * RPC-settable rate - not gated by viewport subscription like PriceModule's
 * SimulatedPricesProvider - so update throughput is directly comparable to
 * ag-grid's own published benchmark methodology.
 */
object BenchmarkPriceModule {

  final val NAME = "BENCHMARK"
  final val Table10k = "benchmarkInstruments10k"
  final val Table100k = "benchmarkInstruments100k"

  private def columns = Columns.fromNames(
    "ric".string(), "symbol".string(), "name".string(), "exchange".string(), "currency".string(),
    "bid".double(), "ask".double(), "last".double(),
    "bidSize".int(), "askSize".int(), "open".double(), "volume".int(), "changePercent".double()
  )

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = Table10k,
          keyField = "ric",
          customColumns = columns,
          options = TableDefOptions(autoSubscribe = true, joinFields = List("ric"))
        ),
        (table, _) => new BenchmarkTickProvider(table, rowCount = 10000),
        (table, provider, _, tableContainer: TableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new BenchmarkPriceService(table, provider)(tableContainer)
        )
      )
      .addTable(
        TableDef(
          name = Table100k,
          keyField = "ric",
          customColumns = columns,
          options = TableDefOptions(autoSubscribe = true, joinFields = List("ric"))
        ),
        (table, _) => new BenchmarkTickProvider(table, rowCount = 100000),
        (table, provider, _, tableContainer: TableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new BenchmarkPriceService(table, provider)(tableContainer)
        )
      )
      .asModule()
  }
}
