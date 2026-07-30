package org.finos.vuu.core.module.metrics

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.metrics.MetricsSchema.ViewPortParallelism
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport.ViewPortContainer

class MetricsViewPortParallelismProvider(table: DataTable, viewPortContainer: ViewPortContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                                                 metrics: MetricsProvider) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("viewPortParallelismProviderThread", () => runOnce(), minCycleTime = 1_000)

  lifecycleContainer(this).dependsOn(runner)

  private val treeWorkRate = new CounterRatePerSecond(viewPortContainer.totalTreeWorkHistogram)
  private val flatWorkRate = new CounterRatePerSecond(viewPortContainer.totalFlatWorkHistogram)

  private def runOnce(): Unit = {
    val treeRate = treeWorkRate.perSecond() // this is ms of work done per second
    val flatRate = flatWorkRate.perSecond()

    val tree = Map("type" -> "tree", ViewPortParallelism.work_ms_in_1m -> treeRate, ViewPortParallelism.work_par_ratio -> (treeRate / 1000))
    val flat = Map("type" -> "flat", ViewPortParallelism.work_ms_in_1m -> flatRate, ViewPortParallelism.work_par_ratio -> (flatRate / 1000))

    table.processUpdate("tree", RowWithData("tree", tree))
    table.processUpdate("flat", RowWithData("flat", flat))
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "viewPortParallelismProvider"
}
