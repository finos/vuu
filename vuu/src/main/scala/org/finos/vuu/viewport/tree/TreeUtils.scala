package org.finos.vuu.viewport.tree

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray

object TreeUtils extends StrictLogging {

  def isDiff(oldNode: TreeNode, newNode: TreeNode, oldState: TreeNodeState, newState: TreeNodeState): Boolean = {
    //logger.info(oldNode.key + "->" + oldNode.childRowsHash() + "->" + newNode.childRowsHash() + "->" + (NotNull(newState) && (newState != oldState)) + "->" + (NotNull(oldState) && (newState != oldState)))
    if(oldNode.childRowsHash() != newNode.childRowsHash()
    || (NotNull(newState) && (newState != oldState))
    || (NotNull(oldState) && (newState != oldState))
    //this is a hack to allow the optimization of the tree build,
    //the first time the tree is built, the child size will be 0, subsequent builds it will be correct
    || oldNode.getChildren.size() != newNode.getChildren.size()
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

  def diffOldVsNewBranches(oldTree: Tree, newTree: Tree, oldNodeState: TreeNodeStateStore): ImmutableArray[String] = {
    val arr = oldTree.nodes().filter(notLeafOrRoot).filter( oldNode => {
      newTree.getNode(oldNode.key) match {
        case newNode: TreeNode =>
          val oldState = oldNodeState.get(oldNode.key)
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
