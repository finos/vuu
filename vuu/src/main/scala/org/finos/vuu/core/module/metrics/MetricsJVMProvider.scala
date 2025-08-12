package org.finos.vuu.core.module.metrics

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport.ViewPortContainer
import org.finos.vuu.core.table.{DataTable, RowWithData}

import java.lang.management.{ManagementFactory, MemoryUsage}

class MetricsJVMProvider(table: DataTable, viewPortContainer: ViewPortContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                                 metrics: MetricsProvider) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("MetricsJVMProviderThread", () => runOnce(), minCycleTime = 2_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "MetricsJVMProvider"

  def toMb(bytes: Long): Double = {
    (bytes / 1024) / 1024
  }

  def buildMachineCores(): Map[String, Any] = {
    val processors = Runtime.getRuntime.availableProcessors
    Map("cpu-cores" -> processors)
  }

  def buildHeapData(heap: MemoryUsage): Map[String, Any] = {
    Map(
      "mem-type" -> "heap",
      "max_MB" -> toMb(heap.getMax),
      "committed_MB" -> toMb(heap.getCommitted),
      "init_MB" -> toMb(heap.getInit),
      "used_MB" -> toMb(heap.getUsed)
    )
  }

  def buildNonHeapData(nonheap: MemoryUsage): Map[String, Any] = {
    Map(
      "mem-type" -> "nonheap",
      "max_MB" -> toMb(nonheap.getMax),
      "committed_MB" -> toMb(nonheap.getCommitted),
      "init_MB" -> toMb(nonheap.getInit),
      "used_MB" -> toMb(nonheap.getUsed)
    )
  }

  def runOnce(): Unit = {

    val memBean = ManagementFactory.getMemoryMXBean
    val heap = memBean.getHeapMemoryUsage
    val nonHeap = memBean.getNonHeapMemoryUsage

    val heapMap = buildHeapData(heap) ++ buildMachineCores()
    val nonHeapMap = buildNonHeapData(nonHeap) ++ buildMachineCores()

    table.processUpdate("heap", RowWithData("heap", heapMap))
    table.processUpdate("nonheap", RowWithData("nonheap", nonHeapMap))
  }

}
