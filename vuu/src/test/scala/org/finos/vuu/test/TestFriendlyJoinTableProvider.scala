package org.finos.vuu.test

import org.finos.vuu.core.table.{DataTable, JoinTable}
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.provider.join.JoinTableUpdate

import java.util

class TestFriendlyJoinTableProvider extends JoinTableProvider {
  override def hasJoins(tableName: String): Boolean = {false}
  override def sendEvent(tableName: String, ev: util.HashMap[String, Any]): Unit = {}
  override def sendJoinEvent(tableName: String, ev: util.HashMap[String, Any]): Unit = {}
  override def addJoinTable(join: JoinTable): Unit = {}
  override def runOnce(): Unit = {}
  override def start(): Unit = ???

  override def doStop(): Unit = ???
  override def doStart(): Unit = ???
  override def doInitialize(): Unit = ???
  override def doDestroy(): Unit = ???
  override val lifecycleId: String = "testFriendlyJoinProvider"
  override def drainQueue_ForTesting(): (Int, util.ArrayList[JoinTableUpdate]) = ???
}
