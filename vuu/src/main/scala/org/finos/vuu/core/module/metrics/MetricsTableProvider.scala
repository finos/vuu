package org.finos.vuu.core.module.metrics

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.provider.Provider
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.viewport.ViewPortTable

class MetricsTableProvider(table: DataTable, tableContainer: TableContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                             metrics: MetricsProvider) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("metricsTableProvider", () => runOnce(), minCycleTime = 1_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "metricsTableProvider"

  def runOnce(): Unit = {
    try {
      tableContainer.getTables.foreach(vpTable =>
        table.processUpdate(vpTable.table, RowWithData(vpTable.table, getMetricsData(vpTable)))
      )
    } catch {
      case e: Exception => logger.error("Error occured in metrics", e)
    }
  }

  private def getMetricsData(vpTable: ViewPortTable): Map[String, Any] = {
    val counter = metrics.counter(vpTable.table + ".processUpdates.Counter")
    val size = tableContainer.getTable(vpTable.table).size()
    val meter = metrics.meter(vpTable.table + ".processUpdates.Meter")

    Map(
      "table" -> (vpTable.module + "-" + vpTable.table),
      "updateCount" -> counter.getCount,
      "size" -> size,
      "updatesPerSecond" -> meter.getOneMinuteRate
    )
  }
}
