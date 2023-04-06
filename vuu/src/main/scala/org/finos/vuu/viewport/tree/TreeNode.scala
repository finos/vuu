package org.finos.vuu.viewport.tree

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{Column, RowData}

import scala.jdk.CollectionConverters.ListHasAsScala
import java.util.{LinkedList => JList}

object TreeNode {
  final val ROOT_KEY = "$root"
}

trait TreeNode {
  def isLeaf: Boolean
  def key: String
  def originalKey: String
  def getChildren: JList[TreeNode]
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

  override def getChildren: JList[TreeNode] = children

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
