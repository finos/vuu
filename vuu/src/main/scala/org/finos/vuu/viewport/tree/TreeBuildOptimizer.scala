package org.finos.vuu.viewport.tree

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.viewport.ViewPort

trait TreeBuildAction

case class BuildEntireTree(table: TreeSessionTableImpl, oldTreeOption: Option[Tree]) extends TreeBuildAction
case class FastBuildBranchesOfTree(table: TreeSessionTableImpl, oldTreeOption: Option[Tree]) extends TreeBuildAction
case class OnlyRecalculateTreeKeys(table: TreeSessionTableImpl, oldTreeOption: Option[Tree]) extends TreeBuildAction
object CantBuildTreeErrorState extends TreeBuildAction


object TreeBuildOptimizer extends StrictLogging {

  private def shouldRebuildTree(viewPort: ViewPort, currentStructureHash: Int, currentUpdateCount: Long): Boolean = {

    val table = viewPort.table.asTable

    val shouldRebuild = table match {
      case tbl: TreeSessionTableImpl =>
        val oldTree = Option(tbl.getTree)

        val (previousTreeBuildUpdateCount, previousHashcode, previousNodeStateHashCode) = oldTree match {
          case Some(tree) =>
            (tree.updateCounter, viewPort.getLastHash(), tree.nodeState.hashCode())
          case None =>
            (-1, -3, -4)
        }

        val tableUpdateCounter = table.asTable match {
          case treeTable: TreeSessionTableImpl =>
            treeTable.sourceTable.updateCounter
          case _ =>
            -2
        }

        //FIXME: Chris - there is a further optimization to be done here, where we check if the visual link selection has changed
        //but I have not done it yet
        //this code will force a rebuild if visual linking is setup
        val hasVisualLink = viewPort.getVisualLink match {
          case Some(link) => true
          case None => false
        }

        val shouldRebuild = previousTreeBuildUpdateCount != tableUpdateCounter || previousHashcode != currentStructureHash || hasVisualLink

        if (!shouldRebuild) {
          logger.debug(s"[TREE] Should rebuild tree $shouldRebuild, prevUpdateCounter=$previousTreeBuildUpdateCount updateCounter=$tableUpdateCounter, previousHashcode=$previousHashcode paramsHashcode=$currentStructureHash")
        }

        shouldRebuild
    }

    val lastStructureHash = viewPort.getLastHash()
    val lastUpdateCount = viewPort.getLastUpdateCount()

    shouldRebuild || currentStructureHash != lastStructureHash || currentUpdateCount != lastUpdateCount
  }

  def shouldRecalcKeys(latestNodeState: TreeNodeStateStore, previousNodeState: TreeNodeStateStore): Boolean = {
    latestNodeState.hashCode() != previousNodeState.hashCode()
  }


  def optimize(viewPort: ViewPort, latestNodeState: TreeNodeStateStore): TreeBuildAction = {

    viewPort.table.asTable match {

      case table: TreeSessionTableImpl =>

        val currentStructureHash = viewPort.getStructuralHashCode()
        val currentUpdateCount = viewPort.getTableUpdateCount()

        val rebuildTree = shouldRebuildTree(viewPort, currentStructureHash, currentUpdateCount)
        val recalcKeys  = shouldRecalcKeys(latestNodeState, table.getTree.nodeState)

        //get the previously built tree...
        table.getTree match {
          //if we have no aggregations initially we don't have to build the whole tree
          case EmptyTree if viewPort.getGroupBy.aggregations.isEmpty =>
            FastBuildBranchesOfTree(table, Option(table.getTree))
          //however if we do, we do...
          case EmptyTree if viewPort.getGroupBy.aggregations.nonEmpty =>
            BuildEntireTree(table, None)
          case tree: TreeImpl =>
            tree.buildAction match {
              case Some(action:FastBuildBranchesOfTree) =>
                BuildEntireTree(table, Some(tree))
              case Some(action: OnlyRecalculateTreeKeys) if rebuildTree =>
                BuildEntireTree(table, Some(tree))
              case Some(action:BuildEntireTree) if rebuildTree =>
                BuildEntireTree(table, Some(tree))
              case Some(action:BuildEntireTree) if !rebuildTree =>
                OnlyRecalculateTreeKeys(table, Some(tree))
              case Some(action: OnlyRecalculateTreeKeys) if recalcKeys =>
                OnlyRecalculateTreeKeys(table, Some(tree))
              case Some(action: OnlyRecalculateTreeKeys) if !recalcKeys =>
                OnlyRecalculateTreeKeys(table, Some(tree))
            }
        }
      case x =>
        logger.error(s"I've been asked to build a tree on a non-tree session table, this is bad, vp=${viewPort.id} table=${viewPort.table.name}")
        CantBuildTreeErrorState
    }

  }
}