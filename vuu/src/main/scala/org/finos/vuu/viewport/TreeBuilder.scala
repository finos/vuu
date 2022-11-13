package org.finos.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.filter.{FilterSpecParser, NoFilter}
import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.core.sort.{AntlrBasedFilter, GenericSort, NoSort, Sort}
import org.finos.vuu.core.table.{Column, EmptyRowData, RowData, RowWithData}
import org.finos.vuu.net.{FilterSpec, SortSpec}
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.time.Clock

import java.util.concurrent.ConcurrentHashMap
import java.util.{LinkedList => JList}
import scala.util.{Failure, Success, Try}

trait TreeBuilder {
  def build(): Tree
}

object TreeBuilder {
  //  def apply(table: GroupBySessionTableImpl, groupBy: GroupBy, filter: FilterSpec, previousTree: Option[Tree])(implicit timeProvider: Clock): GroupByTreeBuilder = {
  //    new GroupByTreeBuilderImpl(table, groupBy, filter, previousTree)
  //  }
  def create(table: TreeSessionTableImpl, groupBy: GroupBy, filter: FilterSpec, previousTree: Option[Tree], sort: Option[Sort])(implicit timeProvider: Clock): TreeBuilder = {
    new TreeBuilderImpl(table, groupBy, filter, previousTree, sort)
  }

}


class TreeBuilderImpl(table: TreeSessionTableImpl, groupBy: GroupBy, filter: FilterSpec, previousTree: Option[Tree], sort: Option[Sort])(implicit timeProvider: Clock) extends TreeBuilder with StrictLogging {

  final val EMPTY_TREE_NODE_STATE = new ConcurrentHashMap[String, TreeNodeState]()

  private val logEvery = new LogAtFrequency(3000)
  private final val separator = "|"

  import org.finos.vuu.core.DataConstants._

  private def applyFilter(): ImmutableArray[String] = {
    if (filter != null && !isEmptyString(filter.filter)) {

      logger.debug("has filter, parsing")

      val theFilter = Try(FilterSpecParser.parse(filter.filter)) match {
        case Success(clause) =>
          AntlrBasedFilter(clause)
        case Failure(err) =>
          logger.error(s"could not parse filter ${filter.filter}", err)
          NoFilter
      }

      logger.debug("has filter, applying")

      theFilter.dofilter(table.sourceTable, table.sourceTable.primaryKeys)

    } else
      table.sourceTable.primaryKeys
  }

  private def applySort(filteredKeys: ImmutableArray[String]): ImmutableArray[String] = {
    sort match {
      case Some(aSort) =>
        val keys = aSort.doSort(table.sourceTable, filteredKeys)
        keys
      case None =>
        filteredKeys
    }

  }

  override def build(): Tree = {

    logger.debug("In tree build()")
    logger.debug("Applying Filter()")

    val keys = applyFilter()

    val sortedKeys = applySort(keys)

    logger.debug("building tree")

    val nodeState = previousTree match {
      case Some(EmptyTree) =>
        new ConcurrentHashMap[String, TreeNodeState]()
      case Some(tree: TreeImpl) =>
        tree.nodeState
      case _ =>
        EMPTY_TREE_NODE_STATE
    }

    //root is always open
    val tree = TreeImpl(new TreeNodeImpl(false, "$root", "", new JList[TreeNode](), null, 0, Map(), Aggregation.createAggregations(groupBy)), nodeState, groupBy)

    var count = 0

    sortedKeys.foreach(key => {

      if (logEvery.shouldLog()) logger.debug(s"Done nodes ${count}")

      val columns = groupBy.columns

      val row = table.sourceTable.pullRow(key, table.columns().toList)

      row match {
        case EmptyRowData =>
          logger.debug(s"Empty row daya for key = $key")

        case rowWithData: RowWithData =>

          val last = columns.foldLeft(tree.root)((parent, column) => {
            processBranchColumn(tree, parent.asInstanceOf[TreeNodeImpl], rowWithData.get(column.name), false, column, rowWithData)
          } match {
            case Some(node) => node
            case None => parent
          })

          processBranchColumn(tree, last.asInstanceOf[TreeNodeImpl], key, true, null, rowWithData)

          count += 1
      }




    })

    logger.debug("complete building tree")

    tree //.immutate
  }

  def processBranchColumn(tree: TreeImpl, parent: TreeNodeImpl, data: Any, isLeaf: Boolean, column: Column, row: RowData): Option[TreeNode] = {

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
          logger.debug(s"Node ${treeKey} already exists, just adding to parent:" + parent.key)

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
        //if the child already exists then don't do anything
      }
    }
  }

}
