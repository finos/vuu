package io.venuu.vuu.core.module.metrics

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData}
import io.venuu.vuu.provider.Provider
import io.venuu.vuu.viewport.ViewPortContainer

import scala.jdk.CollectionConverters._

class MetricsViewPortProvider(table: DataTable, viewPortContainer: ViewPortContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                                      metrics: MetricsProvider) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("metricsViewPortProviderThread", () => runOnce, minCycleTime = 1_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "metricsViewPortProvider"

  private var viewportIds = Map[String, String]()

  def runOnce(): Unit = {

    try {

      val histograms = viewPortContainer.viewPortHistograms

      val mapOfHistograms = MapHasAsScala(histograms).asScala

      val toDelete = viewportIds.filterNot(kv => mapOfHistograms.contains(kv._1)).toMap

      mapOfHistograms.foreach({ case (key, histogram) => {
        val snapshot = histogram.getSnapshot
        val vp = viewPortContainer.getViewPortById(key)
        if (vp != null) {
          val upMap = Map("id" -> key, "table" -> vp.table.name, "mean" -> snapshot.getMean, "max" -> snapshot.getMax, "75Perc" -> snapshot.get75thPercentile(), "99Perc" -> snapshot.get99thPercentile(), "99_9Perc" -> snapshot.get999thPercentile());
          table.processUpdate(key, RowWithData(key, upMap), clock.now())
        } else {
          //table.processDelete(key)
        }
      }
      })

      toDelete.foreach({ case (key, _) =>
        table.processDelete(key)
      })

      viewportIds = mapOfHistograms.map({ case (key, _) => (key -> key) }).toMap

    } catch {
      case e: Exception =>
        logger.error("Error occured in metrics", e)
    }
  }
}
