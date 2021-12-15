package io.venuu.vuu.provider.join

import io.venuu.toolbox.collection.array.ImmutableArray
import io.venuu.toolbox.collection.set.ImmutableUniqueArraySet
import io.venuu.vuu.api.JoinTableDef
import io.venuu.vuu.core.table.DataTable

import java.util
import java.util.concurrent.ConcurrentHashMap

case class JoinDefToJoinTable(joinDef: JoinTableDef, table: DataTable)

/**
 * THe purpose of this object is to allow us to go from a right key, say prices, ric = VOD.L and look
 * For the corresponding left keys, say orders, orderId = 1,2,3
 */
class RightToLeftKeys {

  private val keysToRightKeys = new ConcurrentHashMap[String, ConcurrentHashMap[String, ConcurrentHashMap[String, ImmutableArray[String]]]]()

  def addRightKey(rightTable: String, rightKey: String, leftTable: String, leftKey: String): Unit = {

    val rightTableMap = keysToRightKeys.computeIfAbsent(rightTable, rightTable => new ConcurrentHashMap[String, ConcurrentHashMap[String, ImmutableArray[String]]]())

    if (rightKey != null) {
      val rightKeyMap = rightTableMap.computeIfAbsent(rightKey, rightKey => new ConcurrentHashMap[String, ImmutableArray[String]]())

      val keys = rightKeyMap.computeIfAbsent(leftTable, leftTable => ImmutableUniqueArraySet.from(Array(leftKey)))

      rightKeyMap.put(leftTable, keys.+(leftKey))
    }
  }

  def getLeftTableKeysForRightKey(rightTable: String, rightKey: String, leftTable: String): ImmutableArray[String] = {

    val rightTableMap = keysToRightKeys.computeIfAbsent(rightTable, rightTable => new ConcurrentHashMap[String, ConcurrentHashMap[String, ImmutableArray[String]]]())

    val rightKeyMap = rightTableMap.computeIfAbsent(rightKey, rightKey => new ConcurrentHashMap[String, ImmutableArray[String]]())

    val keys = rightKeyMap.computeIfAbsent(leftTable, leftTable => ImmutableUniqueArraySet.empty[String]())

    keys
  }
}

class TableDataSink(val name: String) {

  private val eventMap = new ConcurrentHashMap[String, util.HashMap[String, Any]]()

  def getEventState(key: String): util.HashMap[String, Any] = {
    if (key != null) {
      eventMap.get(key)
    } else {
      null
    }
  }

  def putEventState(key: String, ev: util.HashMap[String, Any]) = {
    eventMap.put(key, ev)
  }
}

class JoinManagerEventDataSink {

  private val tableMap = new ConcurrentHashMap[String, TableDataSink]()

  def addSinkForTable(tableName: String) = {
    tableMap.computeIfAbsent(tableName, tableName => new TableDataSink(tableName))
  }

  def getEventDataSink(tableName: String): TableDataSink = {
    tableMap.computeIfAbsent(tableName, tableName => new TableDataSink(tableName))
  }
}
