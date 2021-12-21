package io.venuu.vuu.viewport

import io.venuu.toolbox.collection.array.ImmutableArray

object TreeUtils {

  def isDiff(oldNode: TreeNode, newNode: TreeNode): Boolean = {
    oldNode.getChildren.size != newNode.getChildren.size
  }

  def diffOldVsNewBranches(oldTree: Tree, newTree: Tree): ImmutableArray[String] = {

    val arr = oldTree.nodes().filter(!_.isRoot).filter( oldNode => {
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
