package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.{JoinTableDef, TableDef}
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.viewport.{RowProcessor, ViewPortColumns}
import org.finos.toolbox.collection.array.{ImmutableArray, ImmutableArrays}
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys

import java.util
import java.util.concurrent.ConcurrentHashMap
import scala.collection.mutable

/**
 * When we are a ViewPort listening on a join table, we want to register our interest
 * but we want updates via Join Manager, not via the underlying tables (at mo)
 *
 * So we wrap the listener and discard the message.
 */
case class WrappedKeyObserver[T](wrapped: KeyObserver[T]) extends KeyObserver[T] with StrictLogging {
  override def onUpdate(update: T): Unit = {
    logger.debug(s"suppressing tick for $update as am wrapped")
  }

  override def hashCode(): Int = wrapped.hashCode()

  override def equals(obj: scala.Any): Boolean = {

    obj match {
      case value: WrappedKeyObserver[_] =>
        wrapped.equals(value.wrapped)
      case _ =>
        wrapped.equals(obj)
    }

  }
}

case class ForeignKeyRef(foreignTable: DataTable, foreignKey: String)

case class JoinDataTableData(tableDef: JoinTableDef, var keysByJoinIndex: Array[ImmutableArray[String]] = ImmutableArrays.empty[String](2), keyToIndexMap: ConcurrentHashMap[String, Integer] = new ConcurrentHashMap[String, Integer]()) extends StrictLogging {

  val rightTables: Array[String] = tableDef.rightTables

  val joinTableNames: Seq[String] = tableDef.joinTableNames
  val joinFields: Array[String] = tableDef.joinFieldNames
  val columns: Array[Column] = tableDef.getJoinDefinitionColumns()

  val primaryKeyMask: Seq[Boolean] = primaryKeyIndicesByTable

  assert(joinTableNames.size == columns.length)
  assert(joinFields.length == columns.length)
  assert(primaryKeyMask.length == columns.length)

  def isPrimaryKeyColumn(col: JoinColumn): Boolean = {
    val source = col.sourceTable
    val sourceColumn = col.sourceColumn

    source.keyField == sourceColumn.name
  }

  def primaryKeyIndicesByTable: List[Boolean] = {
    columns.map {
      case jc: JoinColumn => isPrimaryKeyColumn(jc)
      case _ => false
    }.toList
  }

  def getKeyValuesByTable(origPrimaryKey: String): Map[String, String] = {

    val primaryKeyIndex = keyToIndexMap.get(origPrimaryKey)
    var keyIndex = 0

    //logger.info(s"Getting foreign keys for $origPrimaryKey ix = $primaryKeyIndex")

    if (primaryKeyIndex == null)
      return null

    val map = new mutable.HashMap[String, String]()

    while (keyIndex < joinFields.length) {

      val key = if (keysByJoinIndex(keyIndex).length <= primaryKeyIndex) {
        null
      } else {
        keysByJoinIndex(keyIndex)(primaryKeyIndex)
      }

      val tableName = joinTableNames(keyIndex)

      val isPrimaryKey = primaryKeyMask(keyIndex)

      if (isPrimaryKey) {
        logger.debug(s"found foreign key $key in table $tableName for primary key $origPrimaryKey ")
        map.put(tableName, key)
      }


      keyIndex += 1
    }

    map.toMap
  }

  def rowUpdateToArray(update: RowWithData): Array[Any] = {
    //val data    = columns.map(update.get(_))

    var index = 0
    val result = Array.ofDim[Any](columns.length)

    while (index < columns.length) {
      val column = columns(index)

      val data = update.getFullyQualified(column)

      result(index) = data

      index += 1
    }

    result
  }

  private def isAutoSubscribe(table: DataTable): Boolean = {
    table.isInstanceOf[AutoSubscribeTable]
  }

  protected def checkAndAutosubscribe(foreignKey: String, table: DataTable): Unit = {
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


  def processDelete(rowKey: String): JoinDataTableData = {

    keyToIndexMap.get(rowKey) match {
      case null =>
        //do nothing means key doesn't exist
        logger.debug(s"got a process delete message for key $rowKey but doesn't exist")
        this

      case index: Integer =>

        logger.debug(s"processing rowKey delete, key = $rowKey, index = $index")

        var joinFieldIndex = 0

        val newKeysByJoinIndex = new Array[ImmutableArray[String]](joinFields.length)

        while (joinFieldIndex < joinFields.length) {

          logger.debug(s"Removing rowKey $rowKey from keys by row index, ix = $joinFieldIndex value = ${keysByJoinIndex(joinFieldIndex)}")

          newKeysByJoinIndex(joinFieldIndex) = keysByJoinIndex(joinFieldIndex).remove(index)

          joinFieldIndex += 1
        }

        logger.debug(s"Removing rowKey $rowKey from keyToIndexMap")

        keyToIndexMap.remove(rowKey)

        val newIndices = newKeysByJoinIndex(0).toArray

        for (i <- newIndices.indices) keyToIndexMap.put(newIndices(i), i)

        JoinDataTableData(tableDef, newKeysByJoinIndex, keyToIndexMap)
    }
  }

  def processUpdate(rowKey: String, rowUpdate: RowWithData, joinTable: JoinTable, sourceTables: Map[String, DataTable]): JoinDataTableData = {

    val updateByKeyIndex = rowUpdateToArray(rowUpdate)

    assert(keysByJoinIndex.size == updateByKeyIndex.length)

    keyToIndexMap.get(rowKey) match {

      //if this key (the primary key for the left table) didn't exist before in the table, that means we can't have listeners
      //so the listeners will be updated out of band
      case null =>

        //find the largest index available slot
        val index = keysByJoinIndex(0).length

        //add reference from key to row index
        keyToIndexMap.put(rowKey, index)

        //create a new immutable array to store the foreign keys in
        val newKeysByJoinIndex = new Array[ImmutableArray[String]](joinFields.length)

        var joinFieldIndex = 0

        while (joinFieldIndex < joinFields.length) {

          val key = updateByKeyIndex(joinFieldIndex)

          //if we have a key for this table in the update
          if (key != null) {

            //then add a new ummutable array entry
            val newKeysByJoinIndexData = keysByJoinIndex(joinFieldIndex).+(key.asInstanceOf[String])

            //set the index value to be the immutale array of foriegn keys
            newKeysByJoinIndex(joinFieldIndex) = newKeysByJoinIndexData

            //if the key value for the join index was null in the incoming message
            //that means potentially the provider for one of the "right" tables
            //may not be subscribed to that key, if this is the case we need to get the key that is the
            //join to this one and ask the table if it wants to have a go.
          } else {

            val newKeysByJoinIndexData = keysByJoinIndex(joinFieldIndex).+(null)

            newKeysByJoinIndex(joinFieldIndex) = newKeysByJoinIndexData

            val sourceTableName = this.columns(joinFieldIndex).asInstanceOf[JoinColumn].sourceTable.name

            val sourceTable = sourceTables(sourceTableName)

            //if this table is an on-demand autosubscribe table (like market data)
            //then try once to subscribe
            if (isAutoSubscribe(sourceTable)) {

              val column = columns(joinFieldIndex).asInstanceOf[JoinColumn]

              val (_, joinIndex) = findJoinColumn(column, joinTable.getTableDef.asInstanceOf[JoinTableDef], columns)

              val rightValue = newKeysByJoinIndex(joinIndex)(index)

              checkAndAutosubscribe(rightValue, sourceTable)
            }
          }

          joinFieldIndex += 1
        }

        JoinDataTableData(tableDef, newKeysByJoinIndex, keyToIndexMap)

      //else if that index does exist then
      case index =>

        var joinFieldIndex = 0

        while (joinFieldIndex < joinFields.length) {

          val oldKeysByJoinIndex = keysByJoinIndex(joinFieldIndex)

          if (index >= oldKeysByJoinIndex.length)
            logger.trace(s"no foreign key found for primary key ix=$index")

          val oldKey = if (index >= oldKeysByJoinIndex.length) null else oldKeysByJoinIndex(index)

          val newKey = updateByKeyIndex(joinFieldIndex)

          if (oldKey != newKey) {

            if (newKey != null) {

              val newKeysByJoinIndex = oldKeysByJoinIndex.set(index, newKey.asInstanceOf[String])

              keysByJoinIndex(joinFieldIndex) = newKeysByJoinIndex

              val foreignTableName = joinTableNames(joinFieldIndex)

              val foreignTable = joinTable.sourceTables(foreignTableName)

              val observers = joinTable.getObserversByKey(rowKey)

              //remove all the observers that were added as part of this table
              //and repoint them to the new key
              observers.foreach(ob => {
                logger.debug(s"[join] changing observer $ob to point from $oldKey to $newKey based on join provider update")
                val wrapped = WrappedKeyObserver(ob)
                foreignTable.removeKeyObserver(oldKey, wrapped)
                if (newKey != null) foreignTable.addKeyObserver(newKey.asInstanceOf[String], wrapped)
              })

            }

          }

          joinFieldIndex += 1
        }


        JoinDataTableData(tableDef, keysByJoinIndex, keyToIndexMap)
    }

  }

}

class JoinTable(val tableDef: JoinTableDef, val sourceTables: Map[String, DataTable], joinProvider: JoinTableProvider)(implicit val metrics: MetricsProvider) extends DataTable with KeyedObservableHelper[RowKeyUpdate] with StrictLogging {

  override protected def createDataTableData(): TableData = ???

  override def name: String = tableDef.name

  override def linkableName: String = name

  private val onUpdateMeter = metrics.meter(name + ".processUpdates.Meter")

  override def indexForColumn(column: Column): Option[IndexedField[_]] = None

  val joinColumns: Int = tableDef.joins.size + tableDef.baseTable.joinFields.size

  var joinData: JoinDataTableData = JoinDataTableData(tableDef, ImmutableArrays.empty[String](joinColumns))

  override def getTableDef: TableDef = tableDef

  def notifyListeners(rowKey: String, isDelete: Boolean = false): Unit = {
    getObserversByKey(rowKey).foreach(obs => {
      obs.onUpdate(RowKeyUpdate(rowKey, this, isDelete))
    })
  }


  override def toString: String = {
    "JoinTable(base=" + this.tableDef.baseTable.name + ",joins=" + this.tableDef.joins.map(join => join.table.name + "[" + join.joinSpec.toString + "]").mkString(",") + ")"
  }

  @volatile private var updateCounterInternal: Long = 0

  override def updateCounter: Long = updateCounterInternal

  override def incrementUpdateCounter(): Unit = updateCounterInternal +=1

  override def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit = {

    onUpdateMeter.mark()

    logger.debug(s"$name processing row update:" + rowKey + " " + rowUpdate)

    joinData = joinData.processUpdate(rowKey, rowUpdate, this, sourceTables)

    sendToJoinSink(rowUpdate)

    notifyListeners(rowKey)

    incrementUpdateCounter()
  }

  private def toEvent(rowData: RowData): java.util.HashMap[String, Any] = {

    val ev = new util.HashMap[String, Any]()

    this.tableDef.joinFields.foreach(field => {
      val column = this.tableDef.columnForName(field)
      ev.put(column.name, rowData.getFullyQualified(column))
    }
    )

    //always add this primary key
    val pk = this.tableDef.columnForName(this.tableDef.keyField)
    ev.put(pk.name, rowData.getFullyQualified(pk))

    ev
  }

  def sendToJoinSink(rowData: RowData): Unit = {
    if (joinProvider.hasJoins(this.tableDef.name)) {
      val event = toEvent(rowData)
      joinProvider.sendEvent(this.tableDef.name, event)
    }
  }


  /**
   * Pull row ith only a key returns the immutable RowData object as its stored within the table.
   * When doing bulk operations on data such as index hits or filters.
   *
   * @param key
   * @return
   */
  override def pullRow(key: String): RowData = {
    pullRow(key, viewPortColumns)
  }

  override def pullRowFiltered(key: String, columns: ViewPortColumns): RowData = {
    pullRow(key, columns)
  }

  lazy val viewPortColumns = ViewPortColumnCreator.create(this, this.tableDef.columns.map(_.name).toList)

  private def keyExistsInLeftMostSourceTable(key: String): Boolean = {
    val keysByTable = joinData.getKeyValuesByTable(key)
    if (keysByTable == null) {
      false
    } else {
      val leftTable = this.tableDef.baseTable.name
      keysByTable.getOrElse(leftTable, null) match {
        case null =>
          false
        case key: String =>
          sourceTables(leftTable).pullRow(key) match {
            case EmptyRowData => false
            case x: RowWithData => true
          }
      }
    }
  }

  override def pullRow(key: String, columns: ViewPortColumns): RowData = {

    val columnsByTable = columns.getColumns()
      .filter(_.isInstanceOf[JoinColumn])
      .map(c => c.asInstanceOf[JoinColumn]).groupBy(_.sourceTable.name)

    val calculatedColumns = columns.getColumns()
      .filter(_.isInstanceOf[CalculatedColumn])

    val keysByTable = joinData.getKeyValuesByTable(key)

    if (keysByTable == null || !keyExistsInLeftMostSourceTable(key))
      EmptyRowData
    else {
      val foldedMap = columnsByTable.foldLeft(Map[String, Any]())({ case (previous, (tableName, columnList)) =>

        val table = sourceTables(tableName)
        val fk = keysByTable(tableName)

        val sourceColumns = ViewPortColumnCreator.create(table,  columnList.map(jc => jc.sourceColumn).map(_.name))

        if (fk == null) {
          logger.debug(s"No foreign key for table $tableName found in join ${tableDef.name} for primary key $key")
          previous
        }
        else {
          table.pullRow(fk, sourceColumns) match {
            case EmptyRowData =>
              previous
            case data: RowWithData =>
              previous ++ columnList.map(column => column.name -> column.sourceColumn.getData(data)).toMap

          }
        }
      })

      val joinedData = RowWithData(key, foldedMap)

      val calculatedData = calculatedColumns.map(c => c.name -> c.getData(joinedData)).toMap

      RowWithData(key, foldedMap ++ calculatedData)
    }
  }


  override def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any] = {

    val asRowData = pullRow(key, columns)

    val asArray = asRowData.toArray(columns.getColumns())

    asArray

//    val columnsByTable = columns.getColumns()
//      .filter(_.isInstanceOf[JoinColumn])
//      .map(c => c.asInstanceOf[JoinColumn])
//      .groupBy(_.sourceTable.name)
//
//    val keysByTable = joinData.getKeyValuesByTable(key)
//
//    if (keysByTable == null || !keyExistsInLeftMostSourceTable(key))
//      Array()
//    else {
//
//      val foldedMap = columnsByTable.foldLeft(Map[JoinColumn, Any]())({ case (previous, (tableName, columnList)) =>
//
//        val table = sourceTables(tableName)
//
//        val fk = if (keysByTable == null) null
//        else
//          keysByTable.get(tableName) match {
//            case Some(fk) => fk
//            case None => null
//          }
//
//        //val sourceColumns = columnList.map(jc => jc.sourceColumn)
//        val sourceColumns = ViewPortColumnCreator.create(table,  columnList.map(jc => jc.sourceColumn).map(_.name))
//
//        if (fk == null) {
//          logger.info(s"No foreign key for table $tableName found in join ${tableDef.name} for primary key $key")
//          previous
//        }
//        else {
//          table.pullRow(fk, sourceColumns) match {
//            case EmptyRowData =>
//              previous
//            case data: RowWithData =>
//              previous ++ columnList.map(column => (column -> column.sourceColumn.getData(data)))
//          }
//        }
//      })
//
//      if (foldedMap.isEmpty) {
//        Array()
//      } else {
//        columns.getColumns().map(c => foldedMap.get(c.asInstanceOf[JoinColumn]) match {
//          case None => ""
//          case Some(x) => x
//        }).toArray[Any]
//      }
//    }
  }

  def notifyListeners(rowKey: String): Unit = {
    getObserversByKey(rowKey).foreach(obs => obs.onUpdate(RowKeyUpdate(rowKey, this)))
  }

  override def processDelete(rowKey: String): Unit = {

    val rowData = this.pullRow(rowKey)

    joinData = joinData.processDelete(rowKey)

    if (rowData != null && rowData != EmptyRowData)
      sendDeleteToJoinSink(rowKey, rowData)

    notifyListeners(rowKey, isDelete = true)

    incrementUpdateCounter()
  }

  def sendDeleteToJoinSink(rowKey: String, rowData: RowData): Unit = {
    if (joinProvider.hasJoins(this.tableDef.name)) {
      val event = toDeleteEvent(rowKey, rowData)
      joinProvider.sendEvent(this.tableDef.name, event)
    }
  }

  private def toDeleteEvent(rowKey: String, rowData: RowData): java.util.HashMap[String, Any] = {

    val ev = new util.HashMap[String, Any]()

    this.tableDef.joinFields.foreach(field => {
      val column = this.tableDef.columnForName(field)
      ev.put(column.name, rowData.get(column))
    }
    )

    //always add this primary key
    val pk = this.tableDef.columnForName(this.tableDef.keyField)
    ev.put(pk.name, rowData.get(pk))
    ev.put("_isDeleted", true)
    ev
  }

  override def readRow(key: String, fields: List[String], processor: RowProcessor): Unit = {
    val columns = fields.map(column => joinData.tableDef.columnForName(column).asInstanceOf[JoinColumn])

    val columnsByTable = columns.groupBy(_.sourceTable.name)

    val keysByTable = joinData.getKeyValuesByTable(key)

    columnsByTable.foreach({ case (tableName, columnList) =>
      val table = sourceTables(tableName)
      val fk = keysByTable(tableName)

      //val sourceColumns = columnList.map(jc => jc.sourceColumn)
      val sourceColumns = ViewPortColumnCreator.create(table,  columnList.map(jc => jc.sourceColumn).map(_.name))

      if (fk == null) {
        logger.info(s"No foreign key for table $tableName found in join ${tableDef.name} for primary key $key")
      }
      else {
        table.pullRow(fk, sourceColumns) match {
          case EmptyRowData =>
            processor.missingRow()
          case data: RowWithData =>
            columnList.foreach(column => {
              column.sourceColumn.getData(data) match {
                case null => processor.missingRowData(key, column)
                case data => processor.processColumn(column, data)
              }
            })
        }
      }
    })
  }

  override def primaryKeys: TablePrimaryKeys = InMemTablePrimaryKeys(joinData.keysByJoinIndex(0))

  def getFKForPK(pk: String): Map[String, String] = {
    joinData.getKeyValuesByTable(pk)
  }

  //in a join table, we must propogate the registration to all child tables also
  override def addKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = {

    val keysByTable = getFKForPK(key)

    if (keysByTable == null) {
      logger.warn(s"tried to subscribe to key $key in join table ${getTableDef.name} but couldn't as not in keys")
      true
    }
    else {
      val wrapped = WrappedKeyObserver(observer)

      sourceTables.foreach({ case (name, table) =>
        keysByTable.get(name) match {
          case Some(foreignKey) if foreignKey != null => table.addKeyObserver(foreignKey, wrapped)
          case Some(null) => logger.trace("Foreign key not ready yet")
          case _ =>
            logger.error(s"Could not load foreign key for ${table.getTableDef.name} (in join with ${this.getTableDef.name} key = $key")
        }
      })

      super.addKeyObserver(key, observer)
    }

  }

  //in a join table, we must propogate the removal of registration to all child tables also
  override def removeKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = {

    val keysByTable = getFKForPK(key)

    if (keysByTable == null) {
      logger.debug(s"tried to remove key $key in join table ${getTableDef.name} but couldn't as not in keys")
      true
    }
    else {
      val wrapped = WrappedKeyObserver(observer)
      sourceTables.foreach({ case (name, table) =>
        keysByTable.get(name) match {
          case null =>
            logger.trace(s"no foreign key for primary key $key")
          case Some(foreignKey) =>
            if (table.isKeyObservedBy(foreignKey, wrapped)) table.removeKeyObserver(foreignKey, wrapped)
          case None => logger.error(s"Could not load foreign key for ${table.getTableDef.name} (in join with ${this.getTableDef.name} key = $key")
        }
      })

      super.removeKeyObserver(key, observer)
    }
  }

  override def getColumnValueProvider: ColumnValueProvider = InMemColumnValueProvider(this)
}
