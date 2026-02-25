package org.finos.vuu.provider.join

import org.finos.toolbox.collection.set.ImmutableArraySet
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.table.DataTable

import java.util
import java.util.concurrent.ConcurrentHashMap

case class JoinDefToJoinTable(joinDef: JoinTableDef, table: DataTable)

/**
 * The purpose of this object is to allow us to go from a right key, say prices, ric = VOD.L and look
 * For the corresponding left keys, say orders, orderId = 1,2,3
 */
class RightToLeftKeys {

  // right table name -> right key -> left table name -> left keys
  private val keysToRightKeys = new ConcurrentHashMap[String, ConcurrentHashMap[String, ConcurrentHashMap[String, ImmutableArraySet[String]]]]()
  private val emptyKeyMap: ImmutableArraySet[String] = ImmutableArraySet.empty

  def addRightKey(rightTable: String, rightKey: String, leftTable: String, leftKey: String, existingRightKey: String): Unit = {
    if (rightKey != null) {

      val rightKeyMap = getRightKeyMap(rightTable, rightKey)

      rightKeyMap.compute(leftTable, (_, existingSet) => {
        existingSet match {
          case null => ImmutableArraySet.of(leftKey)
          case _ => existingSet + leftKey
        }
      })
    }

    if (existingRightKey != null && rightKey != existingRightKey) {
      // Delete the existing mapping of rightTable.rightKey <-> leftTable.leftKey and do cleanup if no mapping left
      val rightKeyMaps = keysToRightKeys.get(rightTable)
      if (rightKeyMaps != null) {
        val leftTableMaps = rightKeyMaps.get(existingRightKey)
        if (leftTableMaps != null) {
          val leftKeys = leftTableMaps.get(leftTable)
          if (leftKeys != null) {
            val newLeftKeys = leftKeys - leftKey
            if (newLeftKeys.isEmpty) {
              leftTableMaps.remove(leftTable)
            } else {
              leftTableMaps.put(leftTable, newLeftKeys)
            }
          }
          if (leftTableMaps.isEmpty) {
            rightKeyMaps.remove(existingRightKey)
          }
        }
        if (rightKeyMaps.isEmpty) {
          keysToRightKeys.remove(rightTable)
        }
      }
    }

  }

  def getLeftTableKeysForRightKey(rightTable: String, rightKey: String, leftTable: String): ImmutableArraySet[String] = {
    getRightKeyMap(rightTable, rightKey).getOrDefault(leftTable, emptyKeyMap)
  }

  private def getRightKeyMap(rightTable: String, rightKey: String): ConcurrentHashMap[String, ImmutableArraySet[String]] = {

    val rightTableMap = keysToRightKeys.computeIfAbsent(rightTable,
      rightTable => new ConcurrentHashMap[String, ConcurrentHashMap[String, ImmutableArraySet[String]]]())

    rightTableMap.computeIfAbsent(rightKey, rightKey => new ConcurrentHashMap[String, ImmutableArraySet[String]]())

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
