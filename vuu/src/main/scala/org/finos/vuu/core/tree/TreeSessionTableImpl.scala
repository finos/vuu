package org.finos.vuu.core.tree

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.text.AsciiUtil
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{GroupByColumns, GroupByTableDef, TableDef}
import org.finos.vuu.core.table._
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.viewport._
import org.finos.vuu.viewport.tree.{EmptyTree, Tree, TreeNode}

import java.util.UUID
import java.util.concurrent.{ConcurrentHashMap, ConcurrentMap}
import scala.jdk.CollectionConverters._



class WrappedUpdateHandlingKeyObserver[T](mapFunc: T => T, override val wrapped: KeyObserver[T], val originalKey: String) extends WrappedKeyObserver[T](wrapped) {
  override def onUpdate(update: T): Unit = {
    //logger.debug(s"WrappedUpdateHandlingKeyObserver mapping data to data ${update}")
    val mappedUpdate = mapFunc(update)
    if (mappedUpdate != null) {
      logger.debug("Sending update to mapped: " + mappedUpdate)
      wrapped.onUpdate(mappedUpdate)
    }else{
      logger.debug("Not sending update to mapped: " + mappedUpdate)
    }
    //super.onUpdate(mappedUpdate)
  }
}

object TreeSessionTable {
  def apply(source: RowSource, session: ClientSessionId, joinProvider: JoinTableProvider)(implicit metrics: MetricsProvider, clock: Clock): TreeSessionTableImpl = {
    new TreeSessionTableImpl(source, session, joinProvider)(metrics, clock)
  }
}

class TreeSessionTableImpl(val source: RowSource, val session: ClientSessionId, joinProvider: JoinTableProvider)
                          (implicit metrics: MetricsProvider, clock: Clock)
  extends InMemDataTable(new GroupByTableDef("", source.asTable.getTableDef), joinProvider)
    with SessionTable with KeyedObservableHelper[RowKeyUpdate] with StrictLogging {

  final val createInstant = clock.now()

  final val uuid: String = UUID.randomUUID().toString

  override def linkableName: String = source.linkableName

  private val wrappedObservers: ConcurrentMap[String, WrappedKeyObserver[RowKeyUpdate]] = new ConcurrentHashMap[String, WrappedKeyObserver[RowKeyUpdate]]()

  @volatile
  private var keys: TablePrimaryKeys = InMemTablePrimaryKeys(ImmutableArray.empty[String])

  @volatile
  private var tree: Tree = EmptyTree

  @volatile
  private var onRowUpdateFn: (String, RowWithData) => Unit = updateNoOp

  @volatile
  private var onRowDeleteFn: String => Unit = deleteNoOp

  private def updateNoOp(key: String, row: RowWithData): Unit = {}

  private def deleteNoOp(key: String): Unit = {}


  def onRawUpdate(fn: (String, RowWithData) => Unit): Unit = {
    onRowUpdateFn = fn
  }

  def onRawDelete(fn: String => Unit): Unit = {
    onRowDeleteFn = fn
  }

  override def processUpdate(rowKey: String, rowData: RowData): Unit = {
    logger.debug(s"ChrisChris>> GroupBySession processUpdate $rowKey $rowData")
    super.processUpdate(rowKey, rowData)
    incrementUpdateCounter()
  }

  override def processDelete(rowKey: String): Unit = super.processDelete(rowKey)

  override def toAscii(count: Int): String = {

    val columns = getTableDef.columns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.take(count)

    val rows = selectedKeys.map(key => pullRowAsArray(key, ViewPortColumnCreator.create(this, columns.map(_.name).toList)))

    val columnNames = (GroupByColumns.get(columns.length) ++ columns).map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }

  override def getTableDef: TableDef = {
    new GroupByTableDef(name, source.asTable.getTableDef)
  }

  def sourceTable: DataTable = source.asTable

  override def asTable: DataTable = this

  override def sessionId: ClientSessionId = session

  override def delete(): Unit = {
    this.removeAllObservers()
    MapHasAsScala(this.wrappedObservers).asScala.foreach({ case (key, v) =>
      v match {
        case upko : WrappedUpdateHandlingKeyObserver[RowKeyUpdate] =>
          this.sourceTable.removeKeyObserver(upko.originalKey, v)
        case x =>
          println("Error: ChrisChris")
      }
    })
  }

  override def pullRow(key: String): RowData = {
    pullRow(key, this.viewPortColumns)
  }

  override def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any] = {
    val node = tree.getNode(key)

    if (node == null) {
      Array.empty
    }
    else if (node.isLeaf)
      node.toArray(tree) ++ getSourceRowDataAsArray(node.originalKey, columns)
    else
      node.toArray(tree) ++ getOnlyTreeColumns(key, columns, node)
  }

  override def readRow(key: String, columns: List[String], processor: RowProcessor): Unit = ???

  /**
   * flow is something like:
   * - Check if key is in tree ($)
   * - if so read for any aggregates at node
   * - return row with key in key position, plus depth etc, but with no values except aggregates in.
   */
  override def pullRow(key: String, columns: ViewPortColumns): RowData = {
    val node = tree.getNode(key)
    if (node == null)
      EmptyRowData
    else if (node.isLeaf)
      RowWithData(key, node.toMap(tree) ++ getSourceRowData(node.originalKey, columns))
    else
      RowWithData(key, node.toMap(tree) ++ getOnlyTreeColumnsAsMap(key, columns, node))
  }


  override def pullRowFiltered(key: String, columns: ViewPortColumns): RowData = {
    val node = tree.getNode(key)
    if (node == null)
      EmptyRowData
    else if (node.isLeaf)
      RowWithData(key, node.toMap(tree) ++ getSourceRowDataFiltered(node.originalKey, columns))
    else
      RowWithData(key, node.toMap(tree) ++ getOnlyTreeColumnsAsMap(key, columns, node))
  }

  private def getSourceRowData(key: String, columns: ViewPortColumns): Map[String, Any] = {
    source.pullRow(key, columns) match {
      case rd: RowWithData => rd.data
      case _ => Map()
    }
  }

  private def getSourceRowDataFiltered(key: String, columns: ViewPortColumns): Map[String, Any] = {
    source.pullRowFiltered(key, columns) match {
      case rd: RowWithData => rd.data
      case _ => Map()
    }
  }

  private def getSourceRowDataAsArray(key: String, columns: ViewPortColumns): Array[Any] = {
    source.pullRowAsArray(key, columns) match {
      case rd: Array[Any] => rd
      case _ => Array.empty
    }
  }

  private def getEmptySourceRowData(key: String, columns: List[Column]): Map[String, Any] = {
    columns.map(column => column.name -> "").toMap
  }

  private def getOnlyTreeColumnsAsMap(key: String, columns: ViewPortColumns, node: TreeNode): Map[String, Any] = {

    columns.getColumns().map(c => {
      val aggregation = node.getAggregationFor(c)

      val r = if (aggregation == null)
        node.keysByColumn.getOrElse(c.name, "")
      else
        aggregation

      c.name -> r

    }).toMap
  }


  private def getOnlyTreeColumns(key: String, columns: ViewPortColumns, node: TreeNode): Array[Any] = {
    val keysByColumn = node.keysByColumn
    columns.getColumns().map(c => {

      val aggregation = node.getAggregationFor(c)

      if (aggregation == null)
        node.keysByColumn.getOrElse(c.name, "")
      else
        aggregation

    }).toArray[Any]
  }

  override def name: String = s"session:$session/groupBy-" + source.name + "_" + createInstant.toString + "-" + uuid

  def tableId: String = name + "@" + hashCode()

  override def toString: String = name

  override def primaryKeys: TablePrimaryKeys = keys

  def sourceTableKeys: TablePrimaryKeys = source.primaryKeys

  def setTree(tree: Tree, keys: TablePrimaryKeys): Unit = {
    logger.debug("set tree")
    this.keys = keys
    this.tree = tree
  }

  def getTree: Tree = this.tree

  //def getNodeState = this.tree.getNodeState()
//  def openTreeKey(treeKey: String): TreeNodeState = {
//    this.tree.open(treeKey)
//    //this.notifyListeners(treeKey, false)
//  }
//
//  def closeTreeKey(treeKey: String): TreeNodeState = {
//    this.tree.close(treeKey)
//    //this.notifyListeners(treeKey, false)
//  }

  def mapKeyToTreeKey(nodeKey: String, treeKey:String, rowUpdate: RowKeyUpdate): RowKeyUpdate = {

    val mapped = rowUpdate.copy(key = treeKey, source = this)
    if(mapped != null) {
      logger.debug(s"Found node for originalKey $nodeKey mapped to $treeKey")
    }

    mapped
  }

  override def addKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = {

    val node = this.tree.getNode(key)

    if (node != null) {

      if (node.isLeaf) {

        val originalKey = node.originalKey

        logger.debug(s"Adding key observer$originalKey for tree key $key")

        val wappedObserver = new WrappedUpdateHandlingKeyObserver[RowKeyUpdate](mapKeyToTreeKey(originalKey, key, _), observer, originalKey)

        wrappedObservers.put(key, wappedObserver)

        sourceTable.addKeyObserver(originalKey, wappedObserver)
      }
      else {
        super.addKeyObserver(key, observer)
      }

    }
    else false
  }

  override def isKeyObservedBy(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = {
    wrappedObservers.containsKey(key)
  }

  //in a join table, we must propogate the removal of registration to all child tables also
  override def removeKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = {
    logger.debug(s"removeKeyObserver:$key")
    //if this is a wrapped observer, observing the underlying table, then...
    wrappedObservers.get(key) match {
      //remove it
      case wo: WrappedUpdateHandlingKeyObserver[RowKeyUpdate] =>
        this.wrappedObservers.remove(key)
        logger.debug(s"Removing wrapped observer: $key -> ${wo.originalKey}")
        sourceTable.removeKeyObserver(wo.originalKey, wo)
      case null =>
        logger.debug(s"remove normal key observer:$key")
        //so remove that from our list of observers
        super.removeKeyObserver(key, observer)
      //otherwise it must be a tree key, i.e. not a real row in underlying table
      case _ =>
        logger.warn("Expecting Wrapped Observer but did not get")
        false
    }
  }
}
