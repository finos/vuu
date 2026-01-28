package org.finos.vuu.provider

import org.finos.vuu.core.table.{DataTable, JoinTableUpdate}
import org.finos.toolbox.lifecycle.LifecycleEnabled
import org.finos.toolbox.thread.RunInThread

trait JoinTableProvider extends RunInThread with LifecycleEnabled {
  def hasJoins(tableName: String): Boolean

  def sendEvent(tableName: String, ev: java.util.HashMap[String, Any]): Unit

  def sendJoinEvent(tableName: String, ev: java.util.HashMap[String, Any]): Unit
  
  def addJoinTable(join: DataTable): Unit

  def start(): Unit

  def drainQueue_ForTesting(): (Int, java.util.ArrayList[JoinTableUpdate])
}
