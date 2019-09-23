package io.venuu.vuu.provider

import java.util

import io.venuu.vuu.core.table.DataTable

/**
  * Created by chris on 22/12/2015.
  */
class TestFriendlyJoinTableProvider extends JoinTableProvider {
  override def hasJoins(tableName: String): Boolean = {false}
  override def sendEvent(tableName: String, ev: util.HashMap[String, Any]): Unit = {}
  override def addJoinTable(join: DataTable): Unit = {}
  override def runOnce(): Unit = {}
  override def start(): Unit = ???

  override def doStop(): Unit = ???
  override def doStart(): Unit = ???
  override def doInitialize(): Unit = ???
  override def doDestroy(): Unit = ???
  override val lifecycleId: String = "testFriendlyJoinProvider"
}
