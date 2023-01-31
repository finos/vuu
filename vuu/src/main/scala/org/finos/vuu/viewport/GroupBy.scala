package org.finos.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{Column, DataTable, RowData}
import org.finos.toolbox.collection.array.ImmutableArray

import java.util
import java.util.concurrent.ConcurrentHashMap
import java.util.{LinkedList => JList}
import scala.jdk.CollectionConverters._

object Aggregation {
  def createAggregations(groupBy: GroupBy): List[NodeAggregation] = {
    groupBy.aggregations.map(agg => agg.aggType match {
      case AggregationType.Sum => new SumAggregation(agg.column)
      case AggregationType.Count => new CountAggregation(agg.column)
      case AggregationType.Average => new AverageAggregation(agg.column)
      case AggregationType.High => new HighAggregation(agg.column)
      case AggregationType.Low => new LowAggregation(agg.column)
    })
  }
}

class AverageAggregation(val column: Column) extends NodeAggregation {
  private var average: Double = 0D
  private var samples: Int = 0

  override def toValue: Any = {
    average
  }
  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)
    if(colData != null){
      val latestValue = colData.toString.toDouble
      average = (average * samples.toDouble + latestValue) / (samples.toDouble + 1)
      samples += 1
    }
  }
}

class HighAggregation(val column: Column) extends NodeAggregation {
  private var value: Double = 0D

  override def toValue: Any = {
    value
  }
  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)
    if(colData != null){
      value = Math.max(value, colData.toString.toDouble)
    }
  }
}

class LowAggregation(val column: Column) extends NodeAggregation {
  private var value: Double = Integer.MAX_VALUE.toDouble

  override def toValue: Any = {
    value
  }
  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)
    if(colData != null){
      value = Math.min(value, colData.toString.toDouble)
    }
  }
}

class SumAggregation(val column: Column) extends NodeAggregation {
  private var value: Double = 0d

  override def toValue: Any = value

  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)

    if (colData != null) {
      value += colData.toString.toDouble
    }
  }
}

class CountAggregation(val column: Column) extends NodeAggregation {
  private val hashSet = new util.HashSet[String]()

  //override def column: Column = ???
  override def toValue: Any = hashSet.size()

  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)

    if (colData != null) {
      if (!hashSet.contains(colData.toString)) hashSet.add(colData.toString)
    }
  }
}

trait NodeAggregation {
  def column: Column

  def toValue: Any

  def processLeaf(row: RowData): Unit

  override def hashCode(): Int = {
    column.name.hashCode + getClass.getName.hashCode
  }

  override def equals(obj: Any): Boolean = {
    obj != null && (this.getClass == obj.getClass) && this.hashCode() == obj.hashCode()
  }
}

object TreeNode {
  final val ROOT_KEY = "$root"
}

trait TreeNode {
  def isLeaf: Boolean
  def key: String
  def originalKey: String
  def getChildren: List[TreeNode]
  def parent: TreeNode
  def depth: Int
  def keysByColumn: Map[String, String]
  def isRoot: Boolean
  def toMap(tree: Tree): Map[String, Any]
  def toArray(tree: Tree): Array[Any]
  def processRowForAggregation(row: RowData): Unit
  def getAggregationFor(column: Column): Any
  def childRowsHash(): Int
}


class TreeNodeImpl(val isLeaf: Boolean, val key: String, val originalKey: String, val children: JList[TreeNode], val parent: TreeNode, val depth: Int, val keysByColumn: Map[String, String], val aggregations: List[NodeAggregation]) extends TreeNode with StrictLogging {

  import TreeNode._

  private lazy val aggregationsByColumn = aggregations.map(a => a.column -> a).toMap

  private var childRowHash: Int = -1

  override def childRowsHash(): Int = childRowHash + aggregations.hashCode()

  override def getAggregationFor(column: Column): Any = {
    aggregationsByColumn.getOrElse(column, null) match {
      case agg: NodeAggregation => agg.toValue
      case null => null
    }
  }

  override def getChildren: List[TreeNode] = ListHasAsScala(children).asScala.toList

  def addChild(node: TreeNode): TreeNode = {
    children.add(node)
    this
  }

  def isRoot: Boolean = key == ROOT_KEY

  override def hashCode(): Int = key.hashCode + childRowHash

  override def equals(obj: scala.Any): Boolean = if (obj.asInstanceOf[TreeNode].key == this.key) true else false

  def toMap(tree: Tree): Map[String, Any] = {
    Map("_depth" -> depth, "_isOpen" -> tree.isOpen(this), "_treeKey" -> key, "_isLeaf" -> isLeaf, "_caption" -> originalKey, "_childCount" -> children.size())
  }

  def toArray(tree: Tree): Array[Any] = {
    Array(depth, tree.isOpen(this), key, isLeaf, originalKey, children.size())
  }

  private def addToHash(row: RowData): Unit = {
    childRowHash = 37 * childRowHash + row.hashCode()
  }

  def processRowForAggregation(row: RowData): Unit = {
    logger.debug(s"Agg Tree Node [${this.key}] Processing row for aggregation:" + row)
    //we calculate the hash for each child row, and add it to the nodes hash
    //this allows us to diff old vs new trees and send only updates for new rows
    addToHash(row)

    aggregations.foreach(_.processLeaf(row))
    if (parent != null) {
      parent.processRowForAggregation(row)
    }
  }

  override def toString: String = s"TreeNode($key)"
}

object EmptyTree extends Tree {

  override def nodes(): Iterable[TreeNode] = Iterable.empty

  override def nodeState: ConcurrentHashMap[String, TreeNodeState] = new ConcurrentHashMap[String, TreeNodeState]()

  override def openAll(): Unit = {}

  override def closeAll(): Unit = {}

  override def root: TreeNode = null

  override def getNode(key: String): TreeNode = null

  override def getNodeByOriginalKey(key: String): TreeNode = null

  override def hasChild(parent: TreeNode, child: TreeNode): Boolean = false

  override def toKeys(): ImmutableArray[String] = ImmutableArray.empty[String]

  override def isOpen(latestNode: TreeNode): Boolean = false
}

trait Tree {

  def nodes(): Iterable[TreeNode]

  def nodeState: ConcurrentHashMap[String, TreeNodeState]

  def openAll(): Unit

  def closeAll(): Unit

  def open(treeKey: String): TreeNodeState = {
    nodeState.put(treeKey, OpenTreeNodeState)
  }

  def close(treeKey: String): TreeNodeState = {
    nodeState.put(treeKey, ClosedTreeNodeState)
  }

  def root: TreeNode

  def getNode(key: String): TreeNode

  def getNodeByOriginalKey(key: String): TreeNode

  def hasChild(parent: TreeNode, child: TreeNode): Boolean

  def toKeys(): ImmutableArray[String]

  def isOpen(latestNode: TreeNode): Boolean

  protected def processNode(node: TreeNode): Array[String] = {

    val latestNode = getNode(node.key)

    if (latestNode.getChildren.isEmpty) {
      if (node.isRoot)
        Array() //don't include root node
      else if (!isOpen(latestNode))
        Array(node.key)
      else
        Array(node.key) //++ latestNode.childKeys.toArray
    }
    else if (!node.isRoot && !isOpen(latestNode))
      Array(node.key)
    else if (node.isRoot) {
      Array() ++ latestNode.getChildren.flatMap(child => processNode(child))
    }
    else {
      Array(node.key) ++ latestNode.getChildren.flatMap(child => processNode(child))
    }

  }
}


case class ImmutableTreeImpl(root: TreeNode, lookup: Map[String, TreeNode], lookupOrigKeyToTreeKey: Map[String, TreeNode], nodeState: ConcurrentHashMap[String, TreeNodeState]) extends StrictLogging with Tree {

  override def nodes(): Iterable[TreeNode] = lookup.values

  def openAll(): Unit = {
    this.lookup.values.foreach(node => if (!node.isRoot) open(node.key))
  }

  def closeAll(): Unit = {
    this.lookup.values.foreach(node => if (!node.isRoot) close(node.key))
  }

  def toKeys(): ImmutableArray[String] = {
    val keys = processNode(getNode("$root"))
    ImmutableArray.from(keys)
  }

  override def getNode(key: String): TreeNode = lookup.getOrElse(key, null)

  override def getNodeByOriginalKey(key: String): TreeNode = lookupOrigKeyToTreeKey.getOrElse(key, null)

  override def hasChild(parent: TreeNode, child: TreeNode): Boolean = parent.getChildren.contains(child)

  //override def toKeys(): ImmutableArray[String] = ???

  def isOpen(latestNode: TreeNode): Boolean = {

    if (latestNode.key == TreeNode.ROOT_KEY) {
      true
    } else {
      val state = this.nodeState.get(latestNode.key)

      if (state == null)
        false
      else
        state.isOpen()
    }
  }
}

case class TreeImpl(private val rootNode: TreeNode, nodeState: ConcurrentHashMap[String, TreeNodeState], groupBy: GroupBy) extends StrictLogging with Tree {

  override def nodes(): Iterable[TreeNode] = IteratorHasAsScala(lookup.values().iterator()).asScala.toList

  def immutate: ImmutableTreeImpl = {
    ImmutableTreeImpl(rootNode, MapHasAsScala(lookup).asScala.toMap[String, TreeNode], MapHasAsScala(lookupOrigKeyToTreeKey).asScala.toMap[String, TreeNode], nodeState)
  }

  def openAll(): Unit = {
    CollectionHasAsScala(this.lookup.values()).asScala.foreach(node => if (!node.isRoot) open(node.key))
  }

  def closeAll(): Unit = {
    CollectionHasAsScala(this.lookup.values()).asScala.foreach(node => if (!node.isRoot) close(node.key))
  }

  def root: TreeNode = getNode("$root")

  private val lookup = new ConcurrentHashMap[String, TreeNode](100_000, 0.1f)
  private val lookupOrigKeyToTreeKey = new ConcurrentHashMap[String, TreeNode](100_000, 0.1f)

  setNode(rootNode)

  def toKeys(): ImmutableArray[String] = {
    val keys = processNode(getNode("$root"))
    ImmutableArray.from(keys)
  }

  def isOpen(latestNode: TreeNode): Boolean = {

    if (latestNode.key == TreeNode.ROOT_KEY) {
      true
    } else {
      val state = this.nodeState.get(latestNode.key)

      if (state == null)
        false
      else
        state.isOpen()
    }
  }

  def getNode(key: String): TreeNode = {
    lookup.get(key)
  }

  def getNodeByOriginalKey(originalKey: String): TreeNode = {
    lookupOrigKeyToTreeKey.get(originalKey)
  }

  def setNode(node: TreeNode): Unit = {
    lookup.putIfAbsent(node.key, node)
    lookupOrigKeyToTreeKey.putIfAbsent(node.originalKey, node)
  }

  def hasChild(parent: TreeNode, child: TreeNode): Boolean = parent.getChildren.contains(child)

  def addChild(parent: TreeNode, child: TreeNode): TreeNode = {
    logger.trace(s"adding node ${child.key} to parent ${parent.key}")
    val newParent = parent.asInstanceOf[TreeNodeImpl].addChild(child)
    setNode(newParent)
    setNode(child)
    child
  }

}

trait TreeNodeState {
  def isOpen(): Boolean
}

object OpenTreeNodeState extends TreeNodeState {
  override def isOpen(): Boolean = true
}

object ClosedTreeNodeState extends TreeNodeState {
  override def isOpen(): Boolean = false
}

object AllwaysOpenTreeNodeState extends TreeNodeState {
  override def isOpen(): Boolean = true
}

/**
 * immutable type
 */
case class TrackedKeyNodeState(val tracked: Map[String, Boolean] = Map()) extends TreeNodeState {
  override def isOpen(): Boolean = ???
}


object GroupBy {
  def apply(table: DataTable, columns: Column*): GroupByClause = {
    GroupByClause(table, columns.toList)
  }
}

object AggregationType {
  val Sum: Short = 1
  val Average: Short = 2
  val Count: Short = 3
  val High: Short = 4
  val Low: Short = 5
}

case class Aggregation(column: Column, aggType: Short)

case class GroupBy(columns: List[Column], aggregations: List[Aggregation])

object NoGroupBy extends GroupBy(List(), List())

case class GroupByClause(val table: DataTable, columns: List[Column], aggregations: List[Aggregation] = List()) {
  def withSum(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Sum)))
  def withAverage(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Average)))
  def withHigh(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.High)))
  def withLow(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Low)))
  def withCount(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Count)))

  def asClause(): GroupBy = GroupBy(columns, aggregations)
}