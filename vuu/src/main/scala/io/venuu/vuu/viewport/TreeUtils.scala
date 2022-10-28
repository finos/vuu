package io.venuu.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.collection.array.ImmutableArray

object TreeUtils extends StrictLogging {

  def isDiff(oldNode: TreeNode, newNode: TreeNode, oldState: TreeNodeState, newState: TreeNodeState): Boolean = {
    //logger.info(oldNode.key + "->" + oldNode.childRowsHash() + "->" + newNode.childRowsHash() + "->" + (NotNull(newState) && (newState != oldState)) + "->" + (NotNull(oldState) && (newState != oldState)))
    if(oldNode.childRowsHash() != newNode.childRowsHash()
    || (NotNull(newState) && (newState != oldState))
    || (NotNull(oldState) && (newState != oldState))
    ){
      true
    }else{
      false
    }
  }

  private def NotNull(treeNodeState: TreeNodeState): Boolean = {
    treeNodeState != null
  }

  def notLeafOrRoot(node: TreeNode): Boolean = {
    ! node.isRoot && ! node.isLeaf
  }

  def diffOldVsNewBranches(oldTree: Tree, newTree: Tree, oldNodeState: Map[String, TreeNodeState]): ImmutableArray[String] = {
    val arr = oldTree.nodes().filter(notLeafOrRoot).filter( oldNode => {
      newTree.getNode(oldNode.key) match {
        case newNode: TreeNode =>
          val oldState = oldNodeState.get(oldNode.key) match {
            case Some(nodeState) => nodeState
            case None => null
          }
          val newState = newTree.nodeState.get(oldNode.key)
          isDiff(oldNode, newNode, oldState, newState)
        case null =>
          //old node no longer there
          false
      }
    } ).map(_.key).toArray

    ImmutableArray.from(arr)
  }


}
