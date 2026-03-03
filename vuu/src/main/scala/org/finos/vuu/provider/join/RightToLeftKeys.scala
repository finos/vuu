package org.finos.vuu.provider.join

import org.finos.toolbox.collection.set.ImmutableArraySet

import java.util.concurrent.ConcurrentHashMap

/**
 * The purpose of this object is to allow us to go from a right key, say prices, ric = VOD.L and look
 * For the corresponding left keys, say orders, orderId = 1,2,3
 */
class RightToLeftKeys {

  // right table name -> right key -> left table name -> left keys
  private val keysToRightKeys = new ConcurrentHashMap[String, ConcurrentHashMap[String, ConcurrentHashMap[String, ImmutableArraySet[String]]]]()
  private val emptyKeyMap: ImmutableArraySet[String] = ImmutableArraySet.empty

  def addRightKey(rightTable: String, rightKey: String, leftTable: String, leftKey: String, existingRightKey: String): Unit = {
    if (rightKey == existingRightKey) {
      return
    }

    deleteLeftKeyFromMapping(rightTable, existingRightKey, leftTable, leftKey)
    addLeftKeyToMapping(rightTable, rightKey, leftTable, leftKey)
  }

  private def addLeftKeyToMapping(rightTable: String, rightKey: String, leftTable: String, leftKey: String): Unit = {
    if (rightKey == null) return

    val rightTableMap = keysToRightKeys.computeIfAbsent(rightTable,
      rightTable => new ConcurrentHashMap[String, ConcurrentHashMap[String, ImmutableArraySet[String]]]())

    rightTableMap.compute(rightKey, (_, existingRightKeyMap) => {
      val rightKeyMap = existingRightKeyMap match {
        case null => new ConcurrentHashMap[String, ImmutableArraySet[String]]()
        case _ => existingRightKeyMap
      }

      rightKeyMap.compute(leftTable, (_, existingLeftKeys) => {
        existingLeftKeys match {
          case null => ImmutableArraySet.of(leftKey)
          case _ => existingLeftKeys.add(leftKey)
        }
      })

      rightKeyMap
    })
  }

  def deleteLeftKeyFromMapping(rightTable: String, rightKey: String, leftTable: String, leftKey: String): Unit = {
    if (rightKey == null) return

    val rightTableMap = keysToRightKeys.get(rightTable)
    if (rightTableMap == null) return

    rightTableMap.computeIfPresent(rightKey, (_, existingRightKeyMap) => {

      //Remove the left key and also the left table if no more keys left
      val updatedRightKeyMap = existingRightKeyMap.computeIfPresent(leftTable, (_, leftKeySet) => {
        val updatedSet = leftKeySet.remove(leftKey)
        if (updatedSet.isEmpty) null else updatedSet
      })

      //remove the right key if no more attached left keys
      if (updatedRightKeyMap == null) null else existingRightKeyMap
    })
  }

  def getLeftTableKeysForRightKey(rightTable: String, rightKey: String, leftTable: String): ImmutableArraySet[String] = {
    val rightTableMap = keysToRightKeys.get(rightTable)
    if (rightTableMap == null) return emptyKeyMap

    val rightKeyMap = rightTableMap.get(rightKey)
    if (rightKeyMap == null) return emptyKeyMap

    rightKeyMap.getOrDefault(leftTable, emptyKeyMap)
  }

}