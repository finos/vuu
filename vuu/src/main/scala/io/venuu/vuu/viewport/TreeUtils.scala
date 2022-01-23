package io.venuu.vuu.viewport

import io.venuu.toolbox.collection.array.ImmutableArray

object TreeUtils {

  def isDiff(oldNode: TreeNode, newNode: TreeNode): Boolean = {
    true //oldNode.getChildren.length != newNode.getChildren.length
  }

  def notLeafOrRoot(node: TreeNode): Boolean = {
    ! node.isRoot && ! node.isLeaf
  }

  def diffOldVsNewBranches(oldTree: Tree, newTree: Tree): ImmutableArray[String] = {
    val arr = oldTree.nodes().filter(notLeafOrRoot).filter( oldNode => {
      newTree.getNode(oldNode.key) match {
        case newNode: TreeNode =>
          isDiff(oldNode, newNode)
        case null =>
          //old node no longer there
          false
      }
    } ).map(_.key).toArray

    ImmutableArray.from(arr)
  }


}
