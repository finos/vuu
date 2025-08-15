package org.finos.vuu.core.module.editable

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

class ProcessProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends Provider {

  private val runner = new RunOnceLifeCycleRunner("processProvider", () => runOnce())

  lifecycle(this).dependsOn(runner)

  def runOnce(): Unit = {
    (0 until 10).foreach { i =>
      val procNum = "proc-" + i
      val data = RowWithData(procNum, Map("id" -> procNum, "name" -> ("My Process " + i), "uptime" -> 5000L, "status" -> "running"))
      table.processUpdate(procNum, data)
    }
  }

  override def subscribe(key: String): Unit = {}
  override def doStart(): Unit = {}
  override def doStop(): Unit = {}
  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}

  override val lifecycleId: String = getClass.getSimpleName + "@" + hashCode()
}
