package io.venuu.vuu.provider.join

import io.venuu.vuu.api.JoinTableDef

import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters.MapHasAsScala

/**
 * Join class represents a left to right join table
 */

case class RightKeyTable(key: String, table: String)

class RowJoin(val tableName: String, val leftKey: String, val leftKeyField: String) {

  private val foreignKeyMap = new ConcurrentHashMap[String, String]()

  def toMap(): Map[String, Any] = {
    val asScala = MapHasAsScala(foreignKeyMap).asScala.toMap
    asScala.foldLeft(Map[String, Any]())((map, tuple) => {
      map ++ Map(tableName + "." + tuple._1 -> tuple._2)
    }) ++ Map(tableName + "." + leftKeyField -> leftKey)
  }

  def putJoinKey(leftColumn: String, foreignKey: String) = {
    foreignKeyMap.put(leftColumn, foreignKey)
  }
}

class JoinRelations {

  private val rowJoins = new ConcurrentHashMap[String, ConcurrentHashMap[String, RowJoin]]()

  def addRowJoins(joinDef: JoinTableDef, ev: java.util.HashMap[String, Any]): Unit = {

    val leftKeyField = joinDef.baseTable.keyField

    val leftKey = ev.get(leftKeyField).asInstanceOf[String]

    rowJoins.computeIfAbsent(joinDef.baseTable.name, baseTable => {
      val rowKeysMap = new ConcurrentHashMap[String, RowJoin]()
      rowKeysMap.put(leftKey, new RowJoin(baseTable, leftKey, leftKeyField))
      rowKeysMap
    })

    val rowJoinForTable = rowJoins.get(joinDef.baseTable.name)

    val rowJoin = rowJoinForTable.computeIfAbsent(leftKey, key => new RowJoin(joinDef.baseTable.name, key, leftKeyField))

    joinDef.joins.foreach(joinTo => {

      val leftColumn = joinTo.joinSpec.left
      val leftValue = ev.get(leftColumn)

      if (leftColumn != null && leftValue != null) {
        rowJoin.putJoinKey(leftColumn, leftValue.toString)
      }
    })
  }

  //returns the joins relevant for this left key...
  def getJoinsForEvent(eventType: String, leftKey: String): RowJoin = rowJoins.get(eventType).get(leftKey)
}
