package org.finos.vuu.core.module.metrics

import com.codahale.metrics.Histogram
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport.ViewPortContainer
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock

import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters.MapHasAsScala

class MetricsGroupByProvider(table: DataTable, viewPortContainer: ViewPortContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                                     metrics: MetricsProvider) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("metricsTreeProviderThread", () => runOnce(), minCycleTime = 2_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "metricsGroupByProvider"

  def buildColumnsForHistogram(prefix: String, hist: Histogram): Map[String, Any] = {
    /*
    val settree_mean = "settree_mean"
    val settree_samples = "settree_samples"
    val settree_50_perc = "settree_50_perc"
    val settree_75_perc = "settree_75_perc"
    val settree_99_perc = "settree_99_perc"
    val settree_99_9_perc = "settree_99_9_perc"
     */
    if (hist == null) {
      Map()
    } else {

      val snapshot = hist.getSnapshot

      Map(prefix + "_mean" -> snapshot.getMean, prefix + "_samples" -> snapshot.getValues.length,
        prefix + "_50_perc" -> snapshot.getMedian, prefix + "_75_perc" -> snapshot.get75thPercentile(),
        prefix + "_99_perc" -> snapshot.get99thPercentile(), prefix + "_99_9_perc" -> snapshot.get999thPercentile()
      )
    }
  }

  def runOnce(): Unit = {

    try {

      val treeBuildHistograms = viewPortContainer.treeBuildHistograms
      val treeToKeysHistograms = viewPortContainer.treeToKeysHistograms
      val treeSetKeysHistograms = viewPortContainer.treeSetKeysHistograms
      val treeSetTreeHistograms = viewPortContainer.treeSetTreeHistograms
      val treeDiffBranchesHistograms = viewPortContainer.treeDiffBranchesHistograms

      MapHasAsScala(treeBuildHistograms).asScala.foreach({ case (key, histogram) =>

        val buildMap = buildColumnsForHistogram("build", treeBuildHistograms.get(key))
        val toKeysMap = buildColumnsForHistogram("tokeys", treeToKeysHistograms.get(key))
        val setKeysMap = buildColumnsForHistogram("setkeys", treeSetKeysHistograms.get(key))
        val setTree = buildColumnsForHistogram("settree", treeSetTreeHistograms.get(key))
        val diffBranchesMap = buildColumnsForHistogram("diff_branches", treeDiffBranchesHistograms.get(key))

        val vp = viewPortContainer.getViewPortById(key)
        if (vp != null) {
          val keyhash = key
          val upMap = Map("id" -> key, "table" -> vp.table.name, "realTable" -> vp.table.linkableName) ++ buildMap ++ toKeysMap ++ setKeysMap ++ setTree ++ diffBranchesMap
          table.processUpdate(keyhash, RowWithData(keyhash, upMap))
        }
      })

    } catch {
      case e: Exception =>
        logger.error("Error occured in metrics", e)
    }
  }

}
