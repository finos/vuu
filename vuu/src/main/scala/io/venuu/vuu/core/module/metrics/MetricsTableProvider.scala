package io.venuu.vuu.core.module.metrics

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData, TableContainer}
import io.venuu.vuu.provider.Provider

class MetricsTableProvider (table: DataTable, tableContainer: TableContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                              metrics: MetricsProvider ) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("metricsTableProvider", () => runOnce, minCycleTime = 1_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "metricsTableProvider"

  def runOnce(): Unit ={

    try {

      val tables = tableContainer.getTables()

      tables.foreach(tableDef => {

        val counter = metrics.counter(tableDef.table + ".processUpdates.Counter");
        val size = tableContainer.getTable(tableDef.table).size()

        val meter = metrics.meter(tableDef.table + ".processUpdates.Meter")

        val upMap = Map("table" -> (tableDef.module + "-" + tableDef.table), "updateCount" -> counter.getCount, "size" -> size, "updatesPerSecond" -> meter.getOneMinuteRate);

        table.processUpdate(tableDef.table, RowWithData(tableDef.table, upMap), clock.now())

      })

    } catch {
      case e: Exception =>
        logger.error("Error occured in metrics", e)
    }
  }
}
