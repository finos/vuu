package io.venuu.vuu.core.module.metrics

import com.codahale.metrics.Meter
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData, TableContainer}
import io.venuu.vuu.provider.Provider

class MetricsTableProvider (table: DataTable, tableContainer: TableContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                              metrics: MetricsProvider ) extends Provider {

  private val runner = new LifeCycleRunner("metricsTableProvider", () => runOnce )
  
  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "metricsTableProvider"

  def runOnce(): Unit ={

    val tables = tableContainer.getTableNames()

    tables.foreach( tableName => {

      val counter = metrics.counter(tableName + ".processUpdates.Counter");
      val size = tableContainer.getTable(tableName).size()

      val meter = metrics.meter(tableName + ".processUpdates.Meter")

      val upMap = Map("table" -> tableName, "updateCount" -> counter.getCount, "size" -> size, "updatesPerSecond" -> meter.getOneMinuteRate);

      table.processUpdate(tableName, RowWithData(tableName, upMap), clock.now())

      clock.sleep(500)
    })

  }

}
