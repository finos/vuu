package org.finos.vuu.viewport.tree

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.filter.{FilterSpecParser, NoFilter}
import org.finos.vuu.core.sort.{AntlrBasedFilter, RowPermissionFilter, Sort, TwoStepCompoundFilter}
import org.finos.vuu.core.table.{Column, EmptyRowData, RowData, RowWithData}
import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.viewport.{GroupBy, ViewPortColumns}

import java.util.{LinkedList => JList}
import scala.util.{Failure, Success, Try}

trait TreeBuilder {
  def buildEntireTree(): Tree
  def buildOnlyBranches(): Tree
}

trait BuildType

object BuildTypeFast extends BuildType
object BuildTypeFull extends BuildType

object TreeBuilder {
  def create(table: TreeSessionTableImpl, groupBy: GroupBy, filter: FilterSpec, vpColumns: ViewPortColumns, latestTreeNodeState: TreeNodeStateStore, previousTree: Option[Tree], sort: Option[Sort], buildAction: TreeBuildAction, permissionsChecker: Option[RowPermissionChecker])(implicit timeProvider: Clock): TreeBuilder = {
    new TreeBuilderImpl(table, groupBy, filter, vpColumns, latestTreeNodeState, previousTree, sort, buildAction, permissionsChecker)
  }
}

class TreeBuilderImpl(val table: TreeSessionTableImpl, val groupBy: GroupBy, val filter: FilterSpec, val vpColumns: ViewPortColumns, val latestTreeNodeState: TreeNodeStateStore, val previousTree: Option[Tree], val sort: Option[Sort], val buildAction: TreeBuildAction, checkerOption: Option[RowPermissionChecker])(implicit timeProvider: Clock) extends TreeBuilder with StrictLogging {

  final val EMPTY_TREE_NODE_STATE = TreeNodeStateStore(Map())

  private val logEvery = new LogAtFrequency(3000)
  private val logEveryTreeBuild = new LogAtFrequency(20_000)
  private final val separator = "|"

  import org.finos.vuu.core.DataConstants._

  private def applyFilter(): ImmutableArray[String] = {

    if ((filter != null && !isEmptyString(filter.filter)) || checkerOption.isDefined) {

      logger.debug("has filter, parsing")

      val theFilter = if(filter != null && !isEmptyString(filter.filter)){
        Try(FilterSpecParser.parse(filter.filter)) match {
          case Success(clause) =>
            AntlrBasedFilter(clause)
          case Failure(err) =>
            logger.error(s"could not parse filter ${filter.filter}", err)
            NoFilter
        }
      }else{
        NoFilter
      }

      logger.debug("has filter, applying")

      val realizedFilter = checkerOption match {
        case Some(checker) => TwoStepCompoundFilter(RowPermissionFilter(checker), theFilter)
        case None => theFilter
      }

      realizedFilter.dofilter(table.sourceTable, table.sourceTable.primaryKeys, vpColumns)

    } else
      table.sourceTable.primaryKeys
  }

  private def applySort(filteredKeys: ImmutableArray[String]): ImmutableArray[String] = {
    sort match {
      case Some(aSort) =>
        val keys = aSort.doSort(table.sourceTable, filteredKeys, vpColumns)
        keys
      case None =>
        filteredKeys
    }

  }

  private def shouldRebuildTree(paramsHashcode: Int, previousNodeState: TreeNodeStateStore, latestNodeState: TreeNodeStateStore): (Boolean, Long) = {
    val (previousUpdateCounter, previousHashcode) = previousTree match {
      case Some(tree) =>
        (tree.updateCounter, tree.paramsHashcode)
      case None =>
        (-1, -3)
    }

    val tableUpdateCounter = table.asTable match {
      case treeTable: TreeSessionTableImpl =>
        treeTable.sourceTable.updateCounter
      case _ =>
        -2
    }

    val shouldRebuild = previousUpdateCounter != tableUpdateCounter || previousHashcode != paramsHashcode || previousNodeState.hashCode() != latestNodeState.hashCode()

    if(!shouldRebuild) {
      logger.debug(s"[TREE] Should rebuild tree $shouldRebuild, prevUpdateCounter=$previousUpdateCounter updateCounter=$tableUpdateCounter," +
        s"previousHashcode=$previousHashcode paramsHashcode=$paramsHashcode, previousNodeState.hashCode()=${previousNodeState.hashCode()}, latestNodeState.hashCode()=${latestNodeState.hashCode()}")
    }

    (shouldRebuild , tableUpdateCounter)
  }

  private def getLatestNodeState: TreeNodeStateStore = {
    latestTreeNodeState
  }

  private def getPreviousNodeState: TreeNodeStateStore = {
    previousTree match {
      case Some(tree) => tree.nodeState
      case None => EMPTY_TREE_NODE_STATE
    }
  }

  private def calculateParamsHash(): Int = {
      37 * groupBy.hashCode() ^ filter.hashCode() ^ vpColumns.hashCode() ^ getLatestNodeState.hashCode()
  }


  override def buildEntireTree(): Tree = {
    buildInternal()
  }

  val FIRST_TRIAL_BRANCH_THRESHOLD = 100000

  private def buildInternal(): Tree = {
    logger.debug("In tree build()")
    logger.debug("Applying Filter()")

    val keys = applyFilter()

    val sortedKeys = applySort(keys)

    logger.debug("building tree")

    val latestNodeState = getLatestNodeState

    val previousNodeState = getPreviousNodeState

    val paramsHashCode = calculateParamsHash()

    val (_, updateCounter) = shouldRebuildTree(paramsHashCode, previousNodeState, latestNodeState)

    buildAction match {
      case FastBuildBranchesOfTreeOfRows(table, oldTreeOption) =>
        logger.info("[TREE] Fast Building Branches Of Rows: " + table.name + "@" + table.sourceTable.name)
        val value = ImmutableArray.from(sortedKeys.slice(0, FIRST_TRIAL_BRANCH_THRESHOLD).toArray)
        buildEntireTree(value, onlyBranches = true, latestNodeState, updateCounter, paramsHashCode)
      case FastBuildBranchesOfTree(table, oldTreeOption) =>
        logger.info("[TREE] Fast Building Branches: " + table.name + "@" + table.sourceTable.name)
        buildEntireTree(sortedKeys, onlyBranches = true, latestNodeState, updateCounter, paramsHashCode)
      case BuildEntireTree(table, oldTreeOption) =>
        logger.info("[TREE] Building Entire Tree: " + table.name + "@" + table.sourceTable.name)
        buildEntireTree(sortedKeys, onlyBranches = false, latestNodeState, updateCounter, paramsHashCode)
      case OnlyRecalculateTreeKeys(table, oldTreeOption) =>
        logger.info("[TREE] Only recalcing keys: " + table.name + "@" + table.sourceTable.name)
        oldTreeOption.get
    }
  }

  private def buildEntireTree(sortedKeys: ImmutableArray[String], onlyBranches: Boolean, latestNodeState: TreeNodeStateStore, updateCounter: Long, paramsHashCode: Int): Tree = {

    val tree = new TreeImpl(new TreeNodeImpl(false, "$root", "", new JList[TreeNode](), null, 0, Map(), Aggregation.createAggregations(groupBy)), latestNodeState, groupBy, updateCounter, paramsHashCode, buildAction = Some(buildAction))

    var count = 0

    sortedKeys.foreach(key => {

      if (logEvery.shouldLog()) logger.debug(s"Done nodes $count")

      val columns = groupBy.columns

      val row = table.sourceTable.pullRow(key, vpColumns)

      row match {
        case EmptyRowData =>
          logger.debug(s"Empty row daya for key = $key")

        case rowWithData: RowWithData =>

          val last = columns.foldLeft(tree.root)((parent, column) => {
            processBranchColumn(tree, parent.asInstanceOf[TreeNodeImpl], column.getData(rowWithData), false, column, rowWithData)
          } match {
            case Some(node) => node
            case None => parent
          })

          if (!onlyBranches) {
            processBranchColumn(tree, last.asInstanceOf[TreeNodeImpl], key, true, null, rowWithData)
          } else {
            //logger.info("In build count = 0, only building minial tree")
          }
          count += 1
      }
    })
    logger.debug("complete building tree")

    tree
  }


  override def buildOnlyBranches(): Tree = {
    buildInternal()
  }

  private def processBranchColumn(tree: TreeImpl, parent: TreeNodeImpl, data: Any, isLeaf: Boolean, column: Column, row: RowData): Option[TreeNode] = {

    if (data == null)
      None
    else {

      val treeKey = parent.key + separator + data.toString

      tree.getNode(treeKey) match {
        case null =>
          logger.debug(s"adding new node: $treeKey to parent ${parent.key}")

          val treeKeysByColumn = if (isLeaf) {
            parent.keysByColumn
          } else {
            parent.keysByColumn ++ Map(column.name -> (if (data == null) "" else data.toString))
          }

          val aggregations = Aggregation.createAggregations(groupBy)

          if (isLeaf){
            parent.processRowForAggregation(row)
          }

          Some(tree.addChild(parent, new TreeNodeImpl(isLeaf, treeKey, if (data == null) "" else data.toString, new JList[TreeNode](), parent, parent.depth + 1, treeKeysByColumn, aggregations)))
        case node =>
          logger.debug(s"Node $treeKey already exists, just adding to parent:" + parent.key)

          if (!tree.hasChild(parent, node)) {
            if (isLeaf) {
              parent.processRowForAggregation(row)
            }
            Some(tree.addChild(parent, node))
          }
          else {
            if (isLeaf){
              parent.processRowForAggregation(row)
            }

            Some(node)
          }
      }
    }
  }

}
