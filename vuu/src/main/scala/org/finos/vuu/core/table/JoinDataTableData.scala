package org.finos.vuu.core.table

import com.typesafe.scalalogging.Logger
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.api.JoinTableDef

import scala.collection.immutable.VectorMap

trait JoinDataTableData {

  def processDelete(primaryKey: String): JoinDataTableData

  def processUpdate(primaryKey: String, rowUpdate: RowData, joinTable: JoinTable): JoinDataTableData

  def getPrimaryKeys: ImmutableArray[String]

  def getKeyValuesByTable(primaryKey: String): Map[String, String]

}

object JoinDataTableData {

  private val logger: Logger = Logger(classOf[JoinDataTableData])

  def apply(tableDef: JoinTableDef): JoinDataTableData = {

    val columns: Array[Column] = tableDef.getJoinDefinitionColumns()

    val joinTableNames = tableDef.joinTableNames.toArray
    assert(joinTableNames.length == columns.length)

    val joinFields = tableDef.joinFieldNames
    assert(joinFields.length == columns.length)

    val primaryKeyIndices = columns.indices.filter(f =>
      columns(f) match {
        case jc: JoinColumn =>
          val source = jc.sourceTable
          val sourceColumn = jc.sourceColumn
          source.keyField == sourceColumn.name
        case _ => false
      }
    ).toArray

    val numberOfJoins = tableDef.joins.size + tableDef.baseTable.joinFields.size

    JoinDataTableDataImpl(joinTableNames, joinFields, columns, primaryKeyIndices, VectorMap[String, Array[String]](), logger)
  }

}

private case class JoinDataTableDataImpl(joinTableNames: Array[String],
                                         joinFields: Array[String],
                                         columns: Array[Column],
                                         primaryKeyIndices: Array[Int],
                                         primaryKeyToJoinKeys: Map[String, Array[String]],
                                         logger: Logger) extends JoinDataTableData {

  private lazy val primaryKeys = ImmutableArray.from(primaryKeyToJoinKeys.keys)

  override def getPrimaryKeys: ImmutableArray[String] = primaryKeys

  override def getKeyValuesByTable(primaryKey: String): Map[String, String] = {
    if (primaryKey == null) return null

    val joinKeys = primaryKeyToJoinKeys.getOrElse(primaryKey, null)
    if (joinKeys == null) return null

    val primaryKeysLength = primaryKeyIndices.length
    val builder = Map.newBuilder[String, String]
    builder.sizeHint(primaryKeysLength)

    var keyIndex = 0
    while (keyIndex < primaryKeysLength) {
      val joinIdx = primaryKeyIndices(keyIndex)
      val key = joinKeys(joinIdx)
      logger.trace(s"found foreign key $key in table ${joinTableNames(joinIdx)} for primary key $primaryKey")
      builder += (joinTableNames(joinIdx) -> key)
      keyIndex += 1
    }

    builder.result()
  }

  override def processDelete(primaryKey: String): JoinDataTableData = {
    primaryKeyToJoinKeys.getOrElse(primaryKey, null) match {
      case null => {
        logger.trace(s"Got a process delete message for key $primaryKey that doesn't exist")
        this
      }
      case joinKeys: Array[String] => {
        logger.trace(s"processing rowKey delete, key = $primaryKey")
        val newPrimaryKeyToJoinKeys = primaryKeyToJoinKeys.removed(primaryKey)
        JoinDataTableDataImpl(joinTableNames, joinFields, columns, primaryKeyIndices, newPrimaryKeyToJoinKeys, logger)
      } 
    }
  }

  override def processUpdate(primaryKey: String, rowUpdate: RowData, joinTable: JoinTable): JoinDataTableData = {

    val updateByKeyIndex = rowUpdateToArray(rowUpdate)
    assert(joinFields.length == updateByKeyIndex.length)

    primaryKeyToJoinKeys.getOrElse(primaryKey, null) match {

      //if this key (the primary key for the left table) didn't exist before in the table, that means we can't have listeners
      //so the listeners will be updated out of band
      case null =>

        //create a new immutable array to store the foreign keys in
        val joinKeys = new Array[String](joinFields.length)

        var joinFieldIndex = 0
        val joinFieldsLength = joinFields.length

        while (joinFieldIndex < joinFieldsLength) {

          val key = updateByKeyIndex(joinFieldIndex)

          //if we have a key for this table in the update
          if (key != null) {

            //then add a new immutable array entry
            joinKeys(joinFieldIndex) = key.asInstanceOf[String]

            //if the key value for the join index was null in the incoming message
            //that means potentially the provider for one of the "right" tables
            //may not be subscribed to that key, if this is the case we need to get the key that is the
            //join to this one and ask the table if it wants to have a go.
          } else {

            joinKeys(joinFieldIndex) = null

            val sourceTableName = this.columns(joinFieldIndex).asInstanceOf[JoinColumn].sourceTable.name

            val sourceTable = joinTable.sourceTables(sourceTableName)

            //if this table is an on-demand autosubscribe table (like market data)
            //then try once to subscribe
            if (isAutoSubscribe(sourceTable)) {

              val column = columns(joinFieldIndex).asInstanceOf[JoinColumn]

              val (_, joinIndex) = findJoinColumn(column, joinTable.tableDef, columns)

              val rightValue = joinKeys(joinIndex)

              checkAndAutosubscribe(rightValue, sourceTable)
            }
          }

          joinFieldIndex += 1
        }

        val newPrimaryKeyToJoinKeys = primaryKeyToJoinKeys + (primaryKey -> joinKeys)

        JoinDataTableDataImpl(joinTableNames, joinFields, columns, primaryKeyIndices, newPrimaryKeyToJoinKeys, logger)

      //else if that index does exist then
      case joinKeys: Array[String] =>

        var joinFieldIndex = 0

        //create a copy of the array, to store the foreign keys in
        val newJoinKeys = joinKeys.clone()

        while (joinFieldIndex < joinFields.length) {

          val oldKey = joinKeys(joinFieldIndex)

          val newKey = updateByKeyIndex(joinFieldIndex)

          if (oldKey != newKey) {

            if (newKey != null) {

              newJoinKeys(joinFieldIndex) = newKey.asInstanceOf[String]

              val foreignTableName = joinTableNames(joinFieldIndex)

              val foreignTable = joinTable.sourceTables(foreignTableName)

              val observers = joinTable.getObserversByKey(primaryKey)

              //remove all the observers that were added as part of this table
              //and repoint them to the new key
              observers.foreach(ob => {
                logger.trace(s"[join] changing observer $ob to point from $oldKey to $newKey based on join provider update")
                val wrapped = WrappedKeyObserver(ob)
                if (oldKey != null) {
                  logger.trace(s"[join] removing observer $ob on $oldKey")
                  foreignTable.removeKeyObserver(oldKey, wrapped)
                }
                logger.trace(s"[join] adding observer $ob on $newKey")
                foreignTable.addKeyObserver(newKey.asInstanceOf[String], wrapped)
              })

            } else {

              newJoinKeys(joinFieldIndex) = null

              val foreignTableName = joinTableNames(joinFieldIndex)
              val foreignTable = joinTable.sourceTables(foreignTableName)
              val observers = joinTable.getObserversByKey(primaryKey)

              observers.foreach(ob => {
                val wrapped = WrappedKeyObserver(ob)
                logger.trace(s"[join] removing observer $ob on $oldKey based on join provider update")
                foreignTable.removeKeyObserver(oldKey, wrapped)
              })
            }
          }

          joinFieldIndex += 1
        }

        val newPrimaryKeyToJoinKeys = primaryKeyToJoinKeys + (primaryKey -> newJoinKeys)

        JoinDataTableDataImpl(joinTableNames, joinFields, columns, primaryKeyIndices, newPrimaryKeyToJoinKeys, logger)
    }

  }

  private def rowUpdateToArray(update: RowData): Array[Any] = {
    val cols = columns
    val length = cols.length
    val result = Array.ofDim[Any](length)
    var index = 0
    while (index < length) {
      result(index) = update.getFullyQualified(cols(index))
      index += 1
    }
    result
  }

  private def isAutoSubscribe(table: DataTable): Boolean = {
    table.isInstanceOf[AutoSubscribeTable]
  }

  private def checkAndAutosubscribe(foreignKey: String, table: DataTable): Unit = {
    table match {
      case autoTable: AutoSubscribeTable => autoTable.tryAndSubscribe(foreignKey)
      case _ =>
    }
  }

  /**
   * Find the left hand side of our join column
   */
  private def findJoinColumn(right: JoinColumn, joinDef: JoinTableDef, joinColumns: Array[Column]): (JoinColumn, Int) = {
    val joinTo = joinDef.joins.find(joinTo => joinTo.table.name == right.sourceTable.name && joinTo.joinSpec.right == right.sourceColumn.name).get

    val leftColumn = joinTo.joinSpec.left
    val tableName = joinDef.baseTable.name

    val tuple = joinColumns.zipWithIndex.map({ case (c, i) => (c.asInstanceOf[JoinColumn], i) }).find({ case (c, _) =>
      val maybeColumn = c
      maybeColumn.sourceColumn.name == leftColumn && maybeColumn.sourceTable.name == tableName
    }).get

    tuple
  }
  
}