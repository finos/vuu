package io.venuu.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.ImmutableArray
import io.venuu.vuu.core.table.{Column, DataTable, RowData}

import java.util
import java.util.concurrent.ConcurrentHashMap
import java.util.{LinkedList => JList}
import scala.jdk.CollectionConverters._

object Aggregation{
  def createAggregations(groupBy: GroupBy): List[NodeAggregation] = {
    groupBy.aggregations.map( agg => agg.aggType match {
      case AggregationType.Sum => new SumAggregation(agg.column)
      case AggregationType.Count => new CountAggregation(agg.column)
    } )
  }
}

class SumAggregation(val column: Column) extends NodeAggregation{
  private var value: Double = 0d
  override def toValue: String = "\u03A3 " + value.toString
  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)

    if(colData != null){
      value += colData.toString.toDouble
    }
  }
}

class CountAggregation(val column: Column) extends NodeAggregation{
  private val hashSet = new util.HashSet[String]()

  //override def column: Column = ???
  override def toValue: String = "[" + hashSet.size().toString + "]"

  override def processLeaf(row: RowData): Unit = {
    val colData = column.getData(row)

    if(colData != null){
      if(!hashSet.contains(colData.toString))hashSet.add(colData.toString)
    }
  }
}

trait NodeAggregation{
  def column: Column
  def toValue: String
  def processLeaf(row: RowData): Unit
//{
//    column.getData(row)
//  }
}

object TreeNode{
  final val ROOT_KEY = "$root"
}

trait TreeNode{
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
  def getAggregationFor(column: Column): String
}


case class TreeNodeImpl(isLeaf: Boolean, key: String, originalKey: String, children: JList[TreeNode], parent: TreeNode, depth: Int, keysByColumn: Map[String, String], aggregations: List[NodeAggregation]) extends TreeNode{

  import TreeNode._

  lazy val aggregationsByColumn = aggregations.map( a => a.column -> a).toMap

  override def getAggregationFor(column: Column): String = {
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

  def isRoot = key == ROOT_KEY

  override def hashCode(): Int = key.hashCode

  override def equals(obj: scala.Any): Boolean = if(canEqual(obj) && obj.asInstanceOf[TreeNode].key == this.key) true else false

  def toMap(tree: Tree): Map[String, Any] = {
    Map("_depth" -> depth, "_isOpen" -> tree.isOpen(this), "_treeKey" -> key, "_isLeaf" -> isLeaf, "_caption" -> originalKey, "_childCount" -> children.size())
  }

  def toArray(tree: Tree): Array[Any] = {
    Array(depth, tree.isOpen(this), key, isLeaf, originalKey, children.size())
  }


  def processRowForAggregation(row: RowData): Unit = {
      aggregations.foreach(_.processLeaf(row))
      if(parent != null) parent.processRowForAggregation(row)
  }

//  def open(): TreeNode = {
//    this.copy(isOpen = true)
//  }
//
//  def close(): TreeNode = {
//    this.copy(isOpen = false)
//  }
  override def toString: String = s"TreeNode($key)"
}

object EmptyTree extends TreeImpl(TreeNodeImpl(false, "$root", "", new JList[TreeNode](), null, 0, Map(), List()), new ConcurrentHashMap[String, TreeNodeState](), NoGroupBy){
}

trait Tree {


  def nodeState: ConcurrentHashMap[String, TreeNodeState]

  def openAll(): Unit
  def closeAll(): Unit
  def open(treeKey: String) = {
    nodeState.put(treeKey, OpenTreeNodeState)
  }

  def close(treeKey: String) = {
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

    if(latestNode.getChildren.isEmpty){
      if(node.isRoot)
        Array(node.key) //++ latestNode.childKeys.toArray
      else if(!isOpen(latestNode))
        Array(node.key)
      else
        Array(node.key) //++ latestNode.childKeys.toArray
    }
    else if(!node.isRoot && !isOpen(latestNode))
      Array(node.key)
    else{
      Array(node.key) ++ latestNode.getChildren.flatMap(child => processNode(child))
    }

  }
}


case class ImmutableTreeImpl(root: TreeNode, lookup: Map[String, TreeNode], lookupOrigKeyToTreeKey: Map[String, TreeNode], nodeState: ConcurrentHashMap[String, TreeNodeState]) extends StrictLogging with Tree {

  def openAll() = {
    this.lookup.values.foreach(node => if(!node.isRoot) open(node.key) )
  }

  def closeAll() = {
    this.lookup.values.foreach(node => if(!node.isRoot) close(node.key))
  }

  def toKeys(): ImmutableArray[String] = {
    val keys = processNode(getNode("$root"))
    ImmutableArray.from(keys)
  }

  override def getNode(key: String): TreeNode = lookup.getOrElse(key, null)

  override def getNodeByOriginalKey(key: String): TreeNode = lookupOrigKeyToTreeKey.getOrElse(key, null)

  override def hasChild(parent: TreeNode, child: TreeNode): Boolean = parent.getChildren.contains(child)

  //override def toKeys(): ImmutableArray[String] = ???

  def isOpen(latestNode: TreeNode) = {

    if(latestNode.key == TreeNode.ROOT_KEY){
      true
    }else{
      val state = this.nodeState.get(latestNode.key)

      if(state == null)
        false
      else
        state.isOpen()
    }
  }
}

case class TreeImpl(private val rootNode: TreeNode, nodeState: ConcurrentHashMap[String, TreeNodeState], groupBy: GroupBy) extends StrictLogging with Tree{

  //@volatile private var nodeState = treeNodeState



  def immutate = {

    ImmutableTreeImpl(rootNode, MapHasAsScala(lookup).asScala.toMap[String, TreeNode], MapHasAsScala(lookupOrigKeyToTreeKey).asScala.toMap[String, TreeNode], nodeState)
  }

  def openAll() = {
    CollectionHasAsScala(this.lookup.values()).asScala.foreach(node => if(!node.isRoot) open(node.key) )
  }

  def closeAll() = {
    CollectionHasAsScala(this.lookup.values()).asScala.foreach(node => if(!node.isRoot) close(node.key))
  }

  def root = getNode("$root")

  private val lookup = new java.util.HashMap[String, TreeNode]()
  private val lookupOrigKeyToTreeKey = new java.util.HashMap[String, TreeNode]()

  setNode(rootNode)

  def toKeys(): ImmutableArray[String] = {
    val keys = processNode(getNode("$root"))
    ImmutableArray.from(keys)
  }

  def isOpen(latestNode: TreeNode) = {

    if(latestNode.key == TreeNode.ROOT_KEY){
      true
    }else{
      val state = this.nodeState.get(latestNode.key)

      if(state == null)
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
    lookup.put(node.key, node)
    lookupOrigKeyToTreeKey.put(node.originalKey, node)
  }

  def hasChild(parent: TreeNode, child: TreeNode): Boolean = parent.getChildren.contains(child)

  def addChild(parent: TreeNode, child: TreeNode): TreeNode = {
    logger.trace(s"adding node ${child.key} to parent ${parent.key}")
    val newParent = parent.asInstanceOf[TreeNodeImpl].addChild(child)
    setNode(newParent)
    setNode(child)
    child
  }

//  def addLeafData(node: TreeNode, leafKey: String): TreeNode = {
//    logger.info(s"adding leaf key node ${leafKey} to parent ${node.key}")
//    TreeNode(true, leafKey)
//    node.addChild()
//  }

}

trait TreeNodeState{
  def isOpen(): Boolean
}

object OpenTreeNodeState extends TreeNodeState{
  override def isOpen(): Boolean = true
}

object ClosedTreeNodeState extends TreeNodeState{
  override def isOpen(): Boolean = false
}

object AllwaysOpenTreeNodeState extends TreeNodeState{
  override def isOpen(): Boolean = true
}

/**
  *immutable type
  */
case class TrackedKeyNodeState(val tracked: Map[String, Boolean] = Map()) extends TreeNodeState{


  //  def open(treeKey: String): TrackedKeyNodeState = {
//    TrackedKeyNodeState(tracked + (treeKey -> true))
//  }
//
//  def close(treeKey: String): TrackedKeyNodeState = {
//    TrackedKeyNodeState(tracked + (treeKey -> false))
//  }
//  def isOpen(treeKey: String): Boolean = {
//    tracked.get(treeKey).getOrElse(false)
//  }
  override def isOpen(): Boolean = ???
}


object GroupBy{
  def apply(table: DataTable, columns: String*): GroupByClause = {
    GroupByClause(table, table.columnsForNames(columns.toList))
  }
}

object AggregationType{
  val Sum: Short = 1
  val Average: Short = 2
  val Count: Short = 3
}

case class Aggregation(column: Column, aggType: Short)

case class GroupBy(columns: List[Column], aggregations: List[Aggregation])

object NoGroupBy extends GroupBy(List(), List())

case class GroupByClause(val table: DataTable, columns: List[Column], aggregations: List[Aggregation] = List()){
  def withSum(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Sum)) )
  def withCount(fields: String*): GroupByClause = this.copy(aggregations = aggregations ++ table.columnsForNames(fields.toList).map(Aggregation(_, AggregationType.Count)) )
  def asClause(): GroupBy = GroupBy(columns, aggregations)
}