package org.finos.vuu.viewport.tree

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.viewport.GroupBy

import java.util
import java.util.concurrent.ConcurrentHashMap
import javax.swing.JList
import scala.collection.convert.ImplicitConversions.`collection AsScalaIterable`
import scala.jdk.CollectionConverters.{CollectionHasAsScala, IteratorHasAsScala, MapHasAsScala}

object EmptyTree extends Tree {

  override def nodeState: TreeNodeStateStore = TreeNodeStateStore(Map())

  override def applyNewNodeState(newNodeState: TreeNodeStateStore): Tree = EmptyTree

  override def paramsHashcode: Int = -2

  override def nodes(): Iterable[TreeNode] = Iterable.empty

  override def updateCounter: Long = -1

  override def root: TreeNode = null

  override def getNode(key: String): TreeNode = null

  override def getNodeByOriginalKey(key: String): TreeNode = null

  override def hasChild(parent: TreeNode, child: TreeNode): Boolean = false

  override def toKeys(): ImmutableArray[String] = ImmutableArray.empty[String]()

  override def isOpen(latestNode: TreeNode): Boolean = false
}

trait Tree {
  def updateCounter: Long

  def paramsHashcode: Int
  def nodes(): Iterable[TreeNode]

  def nodeState: TreeNodeStateStore

  def applyNewNodeState(newNodeState: TreeNodeStateStore): Tree

//  def openAll(): Unit
//
//  def closeAll(): Unit

//  def open(treeKey: String): TreeNodeState = {
//    nodeState.put(treeKey, OpenTreeNodeState)
//  }
//
//  def close(treeKey: String): TreeNodeState = {
//    nodeState.put(treeKey, ClosedTreeNodeState)
//  }

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

  //TODO CJS
  protected def processNodeFast(node: TreeNode, keys: Array[String], index: Int): Unit = {

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

//case class ImmutableTreeImpl(root: TreeNode, lookup: Map[String, TreeNode], lookupOrigKeyToTreeKey: Map[String, TreeNode], nodeState: ConcurrentHashMap[String, TreeNodeState]) extends StrictLogging with Tree {
//
//  override def nodes(): Iterable[TreeNode] = lookup.values
//
//  def openAll(): Unit = {
//    this.lookup.values.foreach(node => if (!node.isRoot) open(node.key))
//  }
//
//  def closeAll(): Unit = {
//    this.lookup.values.foreach(node => if (!node.isRoot) close(node.key))
//  }
//
//  def toKeys(): ImmutableArray[String] = {
//    val keys = processNode(getNode("$root"))
//    ImmutableArray.from(keys)
//  }
//
//  override def getNode(key: String): TreeNode = lookup.getOrElse(key, null)
//
//  override def getNodeByOriginalKey(key: String): TreeNode = lookupOrigKeyToTreeKey.getOrElse(key, null)
//
//  override def hasChild(parent: TreeNode, child: TreeNode): Boolean = parent.getChildren.contains(child)
//
//  def isOpen(latestNode: TreeNode): Boolean = {
//
//    if (latestNode.key == TreeNode.ROOT_KEY) {
//      true
//    } else {
//      val state = this.nodeState.get(latestNode.key)
//
//      if (state == null)
//        false
//      else
//        state.isOpen()
//    }
//  }
//}

class TreeImpl(private val rootNode: TreeNode, val nodeState: TreeNodeStateStore, val groupBy: GroupBy, val updateCounter: Long,
               val paramsHashcode: Int,
               val lookup: ConcurrentHashMap[String, TreeNode] = new ConcurrentHashMap[String, TreeNode](100_000),
               val lookupOrigKeyToTreeKey: ConcurrentHashMap[String, TreeNode] = new ConcurrentHashMap[String, TreeNode](100_000)
              ) extends StrictLogging with Tree {

  override def nodes(): Iterable[TreeNode] = IteratorHasAsScala(lookup.values().iterator()).asScala.toList

//  def immutate: ImmutableTreeImpl = {
//    ImmutableTreeImpl(rootNode, MapHasAsScala(lookup).asScala.toMap[String, TreeNode], MapHasAsScala(lookupOrigKeyToTreeKey).asScala.toMap[String, TreeNode], nodeState)
//  }

//  def openAll(): Unit = {
//    CollectionHasAsScala(this.lookup.values()).asScala.foreach(node => if (!node.isRoot) open(node.key))
//  }
//
//  def closeAll(): Unit = {
//    CollectionHasAsScala(this.lookup.values()).asScala.foreach(node => if (!node.isRoot) close(node.key))
//  }


  override def applyNewNodeState(newNodeState: TreeNodeStateStore): Tree = {
    val newTree = new TreeImpl(rootNode, newNodeState, groupBy, updateCounter, paramsHashcode, this.lookup, this.lookupOrigKeyToTreeKey)
    newTree
  }

  def root: TreeNode = getNode("$root")

  //private val lookup = new ConcurrentHashMap[String, TreeNode](100_000)
  //private val lookupOrigKeyToTreeKey = new ConcurrentHashMap[String, TreeNode](100_000)

  setNode(rootNode)

  def toKeys(): ImmutableArray[String] = {
    val keys = processNode(getNode("$root"))
    ImmutableArray.from(keys)
  }

//  def toKeysFast(): ImmutableArray[String] = {
//    val keys = processNodeFast(getNode("$root"), )
//  }

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
    parent.asInstanceOf[TreeNodeImpl].addChild(child)
    //setNode(newParent)
    setNode(child)
    child
  }

}