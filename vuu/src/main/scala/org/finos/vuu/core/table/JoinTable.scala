package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.core.row.{NoRowBuilder, RowBuilder}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.viewport.{RowProcessor, ViewPortColumns}

import java.util

/**
 * When we are a ViewPort listening on a join table, we want to register our interest,
 * but we want updates via Join Manager, not via the underlying tables (at mo)
 *
 * So we wrap the listener and discard the message.
 */
case class WrappedKeyObserver[T](wrapped: KeyObserver[T]) extends KeyObserver[T] with StrictLogging {
  override def onUpdate(update: T): Unit = {
    logger.trace(s"suppressing tick for $update as am wrapped")
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

class JoinTable(val tableDef: JoinTableDef,
                val sourceTables: Map[String, DataTable],
                joinProvider: JoinTableProvider)(implicit val metrics: MetricsProvider, timeProvider: Clock) extends DataTable with KeyedObservableHelper[RowKeyUpdate] with StrictLogging {

  override protected def createDataTableData(): TableData = ???

  override def name: String = tableDef.name

  override def linkableName: String = name

  private val onUpdateMeter = metrics.meter(name + ".processUpdates.Meter")

  private val joinTableIndices = JoinTableIndices(tableDef, sourceTables)

  override def indexForColumn(column: Column): Option[IndexedField[_]] = {
    joinTableIndices.indexForColumn(column)
  }

  @volatile private var joinData: JoinDataTableData = JoinDataTableData(tableDef)

  def getJoinData: JoinDataTableData = joinData
  
  override def getTableDef: JoinTableDef = tableDef

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

  override def incrementUpdateCounter(): Unit = updateCounterInternal += 1

  override def processUpdate(rowKey: String, rowUpdate: RowData): Unit = {

    onUpdateMeter.mark()

    logger.trace(s"$name processing row update: $rowKey $rowUpdate")

    joinData = joinData.processUpdate(rowKey, rowUpdate, this)

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
      joinProvider.sendJoinEvent(this.tableDef.name, event)
    }
  }

  /**
   * Pull row ith only a key returns the immutable RowData object as it's stored within the table.
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

  lazy val viewPortColumns: ViewPortColumns = ViewPortColumnCreator.create(this, this.tableDef.getColumns.map(_.name).toList)

  override def pullRow(key: String, viewPortColumns: ViewPortColumns): RowData = {
    val keysByTable = joinData.getKeyValuesByTable(key)

    if (keysByTable == null || !keyExistsInLeftMostSourceTable(key, keysByTable))
      EmptyRowData
    else {
      val columnsByTable: Map[String, List[JoinColumn]] = viewPortColumns.getJoinColumnsByTable

      val foldedMap = columnsByTable.foldLeft(Map[String, Any]())({
        case (previous, (sourceTableName, columnList)) =>

        val table = sourceTables(sourceTableName)
        val fk = keysByTable(sourceTableName)

        if (fk == null) {
          logger.trace(s"No foreign key for table ${sourceTableName} found in join ${tableDef.name} for primary key $key")
          previous
        } else {
          val sourceColumns = viewPortColumns.getJoinViewPortColumns(sourceTableName)
          table.pullRow(fk, sourceColumns) match {
              case EmptyRowData =>
                previous
              case data: RowWithData =>
                previous ++ columnList.map(column => column.name -> column.sourceColumn.getData(data)).toMap
            }
        }
      })

      //Build the final row data
      if (viewPortColumns.hasCalculatedColumns) {
        RowWithData(key, foldedMap ++ getCalculatedData(viewPortColumns, key, foldedMap))
      } else {
        RowWithData(key, foldedMap)
      }
    }
  }

  private def keyExistsInLeftMostSourceTable(key: String, keysByTable: Map[String, String]): Boolean = {
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

  private def getCalculatedData(joinColumns: ViewPortColumns, key: String, joinData: Map[String, Any]): Map[String, Any] = {
    val rowData = RowWithData(key, joinData)
    joinColumns.getCalculatedColumns.map(c => c.name -> c.getData(rowData)).toMap
  }

  override def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any] = {
    val asRowData = pullRow(key, columns)

    val asArray = asRowData.toArray(columns.getColumns)

    asArray
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
      joinProvider.sendJoinEvent(this.tableDef.name, event)
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
    val columns = fields.map(column => tableDef.columnForName(column).asInstanceOf[JoinColumn])

    val columnsByTable = columns.groupBy(_.sourceTable.name)

    val keysByTable = joinData.getKeyValuesByTable(key)

    columnsByTable.foreach({ case (tableName, columnList) =>
      val table = sourceTables(tableName)
      val fk = keysByTable(tableName)

      val sourceColumns = ViewPortColumnCreator.create(table, columnList.map(jc => jc.sourceColumn).map(_.name))

      if (fk == null) {
        logger.trace(s"No foreign key for table $tableName found in join ${tableDef.name} for primary key $key")
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

  override def primaryKeys: TablePrimaryKeys = InMemTablePrimaryKeys(joinData.getPrimaryKeys)

  private def getFKForPK(pk: String): Map[String, String] = {
    joinData.getKeyValuesByTable(pk)
  }

  //in a join table, we must propagate the registration to all child tables also
  override def addKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = {

    val keysByTable = getFKForPK(key)

    if (keysByTable == null) {
      logger.debug(s"tried to subscribe to key $key in join table ${getTableDef.name} but couldn't as not in keys")
      true
    }
    else {
      val wrapped = WrappedKeyObserver(observer)

      sourceTables.foreach({ case (name, table) =>
        keysByTable.get(name) match {
          case Some(foreignKey) if foreignKey != null => table.addKeyObserver(foreignKey, wrapped)
          case Some(null) => logger.trace(s"Foreign key not ready yet for ${table.getTableDef.name} (in join with ${this.getTableDef.name} key = $key")
          case _ =>
            logger.error(s"Could not load foreign key for ${table.getTableDef.name} (in join with ${this.getTableDef.name} key = $key")
        }
      })

      super.addKeyObserver(key, observer)
    }

  }

  //in a join table, we must propagate the removal of registration to all child tables also
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

  override def newRow(key: String): RowBuilder = ???

  override def rowBuilder: RowBuilder = NoRowBuilder
}
