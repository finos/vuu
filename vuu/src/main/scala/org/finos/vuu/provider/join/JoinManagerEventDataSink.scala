package org.finos.vuu.provider.join

import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.table.JoinTable

import java.util
import java.util.concurrent.ConcurrentHashMap

case class JoinDefToJoinTable(joinDef: JoinTableDef, table: JoinTable)

class TableDataSink(val name: String) {

  private val eventMap = new ConcurrentHashMap[String, util.HashMap[String, Any]]()

  def getEventState(key: String): util.HashMap[String, Any] = {
    if (key != null) {
      eventMap.get(key)
    } else {
      null
    }
  }

  def putEventState(key: String, ev: util.HashMap[String, Any]): util.HashMap[String, Any] = {
    eventMap.put(key, ev)
  }
}

class JoinManagerEventDataSink {

  private val tableMap = new ConcurrentHashMap[String, TableDataSink]()

  def addSinkForTable(tableName: String): TableDataSink = {
    tableMap.computeIfAbsent(tableName, tableName => new TableDataSink(tableName))
  }

  def getEventDataSink(tableName: String): TableDataSink = {
    tableMap.computeIfAbsent(tableName, tableName => new TableDataSink(tableName))
  }
}
