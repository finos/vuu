package org.finos.vuu.core.module.metrics

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.provider.Provider
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock

class MetricsTableProvider(table: DataTable, tableContainer: TableContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                             metrics: MetricsProvider) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("metricsTableProvider", () => runOnce, minCycleTime = 1_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "metricsTableProvider"

  private var lastTableNames: List[String] = List()

  def runOnce(): Unit = {

    try {

      val tables = tableContainer.getTables()

      val tableNames = tables.map(_.table).toList

      val toDelete = lastTableNames.filter(t => !tableNames.contains(t))

      tables.foreach(tableDef => {

        val counter = metrics.counter(tableDef.table + ".processUpdates.Counter");
        val size = tableContainer.getTable(tableDef.table).size()

        val meter = metrics.meter(tableDef.table + ".processUpdates.Meter")

        val upMap = Map("table" -> tableDef.table, "updateCount" -> counter.getCount, "size" -> size, "updatesPerSecond" -> meter.getOneMinuteRate);

        table.processUpdate(tableDef.table, RowWithData(tableDef.table, upMap), clock.now())
      })

      toDelete.foreach(table.processDelete)

      lastTableNames = tableNames

    } catch {
      case e: Exception =>
        logger.error("Error occured in metrics", e)
    }
  }
}
