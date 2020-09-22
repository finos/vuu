package io.venuu.vuu.core.groupby

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.ImmutableArray
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.text.AsciiUtil
import io.venuu.vuu.api.{GroupByColumns, GroupByTableDef, TableDef}
import io.venuu.vuu.core.table._
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.JoinTableProvider
import io.venuu.vuu.viewport._

trait SessionTable extends DataTable with SessionListener {
  def sessionId: ClientSessionId
}

class WrappedUpdateHandlingKeyObserver[T](mapFunc: T => T, override val wrapped: KeyObserver[T]) extends WrappedKeyObserver[T](wrapped){
  override def onUpdate(update: T): Unit = {
    logger.debug(s"WrappedUpdateHandlingKeyObserver mapping data to data $update")
    val mappedUpdate = mapFunc(update)
    if(mappedUpdate != null) wrapped.onUpdate(mappedUpdate)
    //super.onUpdate(mappedUpdate)
  }
}

object GroupBySessionTable{
  def apply(source: RowSource, session: ClientSessionId, joinProvider: JoinTableProvider)(implicit metrics: MetricsProvider): GroupBySessionTable = {
     new GroupBySessionTable(source, session, joinProvider)(metrics)
  }
}

/**
  * Created by chris on 21/11/2015.
  */
class GroupBySessionTable(val source: RowSource, val session: ClientSessionId, joinProvider: JoinTableProvider)
                         (implicit metrics: MetricsProvider)
  extends SimpleDataTable(new GroupByTableDef("", source.asTable.getTableDef), joinProvider)
    with SessionTable with KeyedObservableHelper[RowKeyUpdate] with StrictLogging {

//  def this(source: RowSource, session: ClientSessionId, joinProvider: JoinTableProvider)(implicit metrics: MetricsProvider){
//    this()
//  }

  //source.addSessionListener(this)

  @volatile
  private var keys = ImmutableArray.empty[String]

  @volatile
  private var tree: Tree = EmptyTree

  @volatile
  private var onRowUpdateFn: (String, RowWithData) => Unit = updateNoOp

  @volatile
  private var onRowDeleteFn: (String) => Unit = deleteNoOp

  private def updateNoOp(key: String, row: RowWithData): Unit = {}

  private def deleteNoOp(key: String): Unit = {}


  def onRawUpdate(fn: (String, RowWithData) => Unit) = {
    onRowUpdateFn = fn
  }

  def onRawDelete(fn: (String) => Unit) = {
    onRowDeleteFn = fn
  }

  override def processUpdate(rowKey: String, rowData: RowWithData, timeStamp: Long): Unit = {
    logger.debug(s"ChrisChris>> GroupBySession processUpdate $rowKey $rowData")
    super.processUpdate(rowKey, rowData, timeStamp)
  }

  override def processDelete(rowKey: String): Unit = super.processDelete(rowKey)

  override def toAscii(count: Int) = {

    val columns = getTableDef.columns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.take(count)

    val rows = selectedKeys.map(key => pullRowAsArray(key, columns.toList))

    val columnNames = (GroupByColumns.get(columns.length) ++ columns).map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }

  override def getTableDef: TableDef = {
    new GroupByTableDef(name, source.asTable.getTableDef)
  }

  def sourceTable: DataTable = source.asTable

  override def asTable: DataTable = this


  override def sessionId: ClientSessionId = session

  override def pullRowAsArray(key: String, columns: List[Column]): Array[Any] = {
    val node = tree.getNode(key)

    if(node == null){
      Array.fill[Any](columns.length)("")
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
  override def pullRow(key: String, columns: List[Column]): RowData = {
    val node = tree.getNode(key)
    if(node == null)
      EmptyRowData
    else if (node.isLeaf)
      RowWithData(key, node.toMap(tree) ++ getSourceRowData(node.originalKey, columns))
    else
      RowWithData(key, node.toMap(tree) ++ getOnlyTreeColumnsAsMap(key, columns, node))
  }

  private def getSourceRowData(key: String, columns: List[Column]): Map[String, Any] = {
    source.pullRow(key, columns) match {
      case rd: RowWithData => rd.data
      case _ => Map()
    }
  }

  private def getSourceRowDataAsArray(key: String, columns: List[Column]): Array[Any] = {
    source.pullRowAsArray(key, columns) match {
      case rd: Array[Any] => rd
      case _ => Array.empty
    }
  }

  private def getEmptySourceRowData(key: String, columns: List[Column]): Map[String, Any] = {
    columns.map(column => column.name -> "").toMap
  }

  private def getOnlyTreeColumnsAsMap(key: String, columns: List[Column], node: TreeNode): Map[String, Any] = {

    columns.map(c => {
      val aggregation = node.getAggregationFor(c)

      val r = if( aggregation == null )
        node.keysByColumn.getOrElse(c.name, "")
      else
        aggregation

      c.name -> r

    } ).toMap
  }


  private def getOnlyTreeColumns(key: String, columns: List[Column], node: TreeNode): Array[Any] = {
    val keysByColumn = node.keysByColumn
    columns.map(c => {

      val aggregation = node.getAggregationFor(c)

      if( aggregation == null )
        node.keysByColumn.getOrElse(c.name, "")
      else
        aggregation

    } ).toArray[Any]
  }

  override def name: String = s"session:$session/groupBy-" + source.name

  def tableId: String = name + "@" + hashCode()

  override def toString: String = name

  override def primaryKeys: ImmutableArray[String] = tree.toKeys()

  def sourceTableKeys: ImmutableArray[String] = source.primaryKeys

  def setTree(tree: Tree): Unit = {
    logger.debug("set tree")
    keys = tree.toKeys()
    this.tree = tree
  }

  def getTree: Tree = this.tree

  //def getNodeState = this.tree.getNodeState()
  def openTreeKey(treeKey: String) = {
    this.tree.open(treeKey)
  }

  def closeTreeKey(treeKey: String) = {
    this.tree.close(treeKey)
  }

  def mapKeyToTreeKey(rowUpdate: RowKeyUpdate): RowKeyUpdate = {

    val node = this.getTree.getNodeByOriginalKey(rowUpdate.key)

    val mapped = if(node != null)
                  rowUpdate.copy(key = node.key, source = this)
                else
                  null

    logger.debug(s"Found node $node for originalKey ${rowUpdate.key} mapped to ${node.key}")

    mapped
  }

  override def addKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = {

    val node = this.tree.getNode(key)

    if (node != null) {

      val originalKey = node.originalKey

      logger.debug(s"Adding key observer${originalKey} for tree key ${key}")

      if (originalKey != null) {

        val wappedObserver = new WrappedUpdateHandlingKeyObserver[RowKeyUpdate](mapKeyToTreeKey, observer)

        //val wrapped = WrappedKeyObserver(observer)
        sourceTable.addKeyObserver(originalKey, wappedObserver)
      }
      else false

    }
    else false
  }

  //in a join table, we must propogate the removal of registration to all child tables also
  override def removeKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = {

    //val wrapped = WrappedKeyObserver(observer)

    //if(this.tree.getNode(key).isLeaf){
    sourceTable.removeKeyObserver(key, observer)
    //}

    super.removeKeyObserver(key, observer)

  }

}
