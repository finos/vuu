package org.finos.vuu.provider.join

import org.finos.vuu.api.JoinTableDef

import java.util.concurrent.ConcurrentHashMap

/**
 * Join class represents a left to right join table
 */

class JoinRelations {

  private val rowJoins = new ConcurrentHashMap[String, ConcurrentHashMap[String, RowJoin]]()

  def addRowJoins(joinDef: JoinTableDef, ev: java.util.HashMap[String, Any]): Unit = {

    val leftKeyField = joinDef.baseTable.keyField

    val leftKey = ev.get(leftKeyField).asInstanceOf[String]

    val rowJoinForTable = rowJoins.computeIfAbsent(joinDef.baseTable.name,
      baseTable => new ConcurrentHashMap[String, RowJoin]())

    val rowJoin = rowJoinForTable.computeIfAbsent(leftKey,
      leftKey => new RowJoin(joinDef.baseTable.name, leftKey, leftKeyField))

    joinDef.joins.foreach(joinTo => {

      val leftColumn = joinTo.joinSpec.left
      val leftValue = ev.get(leftColumn)

      if (leftColumn != null && leftValue != null) {
        rowJoin.putJoinKey(leftColumn, leftValue.toString)
      } else if (ev.containsKey(leftColumn) && leftValue == null) {
        rowJoin.deleteJoinKey(leftColumn)
      }
    })
  }

  //returns the joins relevant for this left key...
  def getJoinsForEvent(leftTableName: String, leftKey: String): RowJoin = rowJoins.get(leftTableName).get(leftKey)
}
