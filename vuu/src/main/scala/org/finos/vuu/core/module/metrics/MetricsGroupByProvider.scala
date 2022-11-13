package org.finos.vuu.core.module.metrics

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport.ViewPortContainer
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock

import scala.jdk.CollectionConverters.MapHasAsScala

class MetricsGroupByProvider(table: DataTable, viewPortContainer: ViewPortContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                                     metrics: MetricsProvider) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("metricsGroupByProviderThread", () => runOnce, minCycleTime = 1_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "metricsGroupByProvider"

  def runOnce(): Unit = {

    try {

      val histograms = viewPortContainer.groupByHistograms

      MapHasAsScala(histograms).asScala.foreach({ case (key, histogram) => {
        val snapshot = histogram.getSnapshot
        val vp = viewPortContainer.getViewPortById(key)
        if (vp != null) {
          val keyhash = key.hashCode.toString
          val upMap = Map("id" -> keyhash, "table" -> "", "realTable" -> vp.table.linkableName, "mean" -> snapshot.getMean, "max" -> snapshot.getMax, "75Perc" -> snapshot.get75thPercentile(), "99Per" -> snapshot.get99thPercentile(), "99_9Perc" -> snapshot.get999thPercentile());
          table.processUpdate(keyhash, RowWithData(keyhash, upMap), clock.now())
        }
      }
      })

    } catch {
      case e: Exception =>
        logger.error("Error occured in metrics", e)
    }
  }

}
