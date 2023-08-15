package org.finos.vuu.provider

import org.finos.toolbox.lifecycle.LifecycleEnabled
import org.finos.toolbox.thread.RunInThread
import org.finos.vuu.core.table.JoinTableUpdate
import org.finos.vuu.feature.spec.table.DataTable

trait JoinTableProvider extends RunInThread with LifecycleEnabled {
  def hasJoins(tableName: String): Boolean

  def sendEvent(tableName: String, ev: java.util.HashMap[String, Any]): Unit

  def addJoinTable(join: DataTable): Unit

  def start(): Unit

  def drainQueue_ForTesting(): (Int, java.util.ArrayList[JoinTableUpdate])
}
