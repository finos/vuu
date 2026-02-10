package org.finos.vuu.provider.join

import java.util.concurrent.ConcurrentHashMap

class RowJoin(val tableName: String, val leftKey: String, val leftKeyField: String) {

  private val foreignKeyMap = new ConcurrentHashMap[String, String]()
  private val staticKey = s"$tableName.$leftKeyField"
  private val isDeletedKey = s"$tableName._isDeleted"

  def toMap: Map[String, Any] = {
    val builder = Map.newBuilder[String, Any]
    builder.sizeHint(foreignKeyMap.size + 2)

    builder += (staticKey -> leftKey)
    builder += (isDeletedKey -> false)

    val it = foreignKeyMap.entrySet().iterator()
    while (it.hasNext) {
      val entry = it.next()
      builder += (s"$tableName.${entry.getKey}" -> entry.getValue)
    }

    builder.result()
  }

  def putJoinKey(leftColumn: String, foreignKey: String): String = {
    foreignKeyMap.put(leftColumn, foreignKey)
  }

  def deleteJoinKey(leftColumn: String): String = {
    foreignKeyMap.remove(leftColumn)
  }
}
