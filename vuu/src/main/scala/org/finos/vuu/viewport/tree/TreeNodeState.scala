package org.finos.vuu.viewport.tree


case class TreeNodeStateStore(nodeState: Map[String, TreeNodeState]){

  def get(key: String): TreeNodeState = {
    this.nodeState.getOrElse(key, null)
  }

  def open(treeKey: String): TreeNodeStateStore = {
    this.copy(nodeState ++ Map(treeKey -> OpenTreeNodeState))
  }

  def close(treeKey: String): TreeNodeStateStore = {
    this.copy(nodeState ++ Map(treeKey -> ClosedTreeNodeState))
  }

  def openAll(tree: Tree): TreeNodeStateStore = {
    tree.nodes()
      .filter(!_.isRoot)
      .foldLeft(TreeNodeStateStore(Map()))((x,y) => x.open(y.key))
  }

  def closeAll(tree: Tree): TreeNodeStateStore = {
    tree.nodes()
      .filter(!_.isRoot)
      .foldLeft(TreeNodeStateStore(Map()))((x, y) => x.close(y.key))
  }
}

trait TreeNodeState {
  def isOpen(): Boolean
}

object OpenTreeNodeState extends TreeNodeState {
  override def isOpen(): Boolean = true
  override def toString: String = "OpenTreeNodeState"
}

object ClosedTreeNodeState extends TreeNodeState {
  override def isOpen(): Boolean = false

  override def toString: String = "ClosedTreeNodeState"
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
