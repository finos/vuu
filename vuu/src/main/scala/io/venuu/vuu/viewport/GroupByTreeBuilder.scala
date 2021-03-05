package io.venuu.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.collection.array.ImmutableArray
import io.venuu.toolbox.logging.LogAtFrequency
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.filter.{FilterSpecParser, NoFilter}
import io.venuu.vuu.core.groupby.GroupBySessionTableImpl
import io.venuu.vuu.core.sort.AntlrBasedFilter
import io.venuu.vuu.core.table.{Column, RowData}
import io.venuu.vuu.net.FilterSpec

import java.util.concurrent.ConcurrentHashMap
import java.util.{LinkedList => JList}
import scala.util.{Failure, Success, Try}
/**
  * Created by chris on 23/11/2015.
  */
trait GroupByTreeBuilder {
  def build(): Tree
}

object GroupByTreeBuilder{
  def apply(table: GroupBySessionTableImpl, groupBy: GroupBy, filter: FilterSpec, previousTree: Option[Tree])(implicit timeProvider: Clock): GroupByTreeBuilder = {
    new GroupByTreeBuilderImpl(table, groupBy, filter, previousTree)
  }
}



class GroupByTreeBuilderImpl(table: GroupBySessionTableImpl, groupBy: GroupBy, filter: FilterSpec, previousTree: Option[Tree])(implicit timeProvider: Clock) extends GroupByTreeBuilder with StrictLogging{

  final val EMPTY_TREE_NODE_STATE = new ConcurrentHashMap[String, TreeNodeState]()

  private val logEvery = new LogAtFrequency(3000)

  import io.venuu.vuu.core.DataConstants._

  private def applyFilter(): ImmutableArray[String] = {
    if(filter != null && !isEmptyString(filter.filter))
    {

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

    }else
      table.sourceTable.primaryKeys
  }


  override def build(): Tree = {

    logger.debug("In tree build()")
    logger.debug("Applying FIlter()")

    val keys = applyFilter()

    logger.debug("building tree")

    val nodeState = previousTree match {
      case Some(tree) =>
        tree.nodeState
      case None =>
        EMPTY_TREE_NODE_STATE
    }

    //root is always open
    val tree = new TreeImpl(new TreeNodeImpl(false, "$root", "", new JList[TreeNode](), null, 0, Map(), Aggregation.createAggregations(groupBy) ), nodeState, groupBy)

    var count = 0

    keys.foreach(key => {

      if(logEvery.shouldLog()) logger.debug(s"Done nodes ${count}")

      val columns = groupBy.columns

      val row = table.sourceTable.pullRow(key, table.columns().toList)

      val last = columns.foldLeft(tree.root)((parent, column) => {
        processBranchColumn(tree, parent.asInstanceOf[TreeNodeImpl], row.get(column.name), false, column, row)
      } match {
        case Some(node) => node
        case None => parent
      })

      processBranchColumn(tree, last.asInstanceOf[TreeNodeImpl], key, true, null, row)

      count += 1
    })

    logger.debug("complete building tree")

    tree//.immutate
  }

  def processBranchColumn(tree: TreeImpl, parent: TreeNodeImpl, data: Any, isLeaf: Boolean, column: Column, row: RowData): Option[TreeNode] = {

    if (data == null)
      None
    else {

      val treeKey = parent.key + "/" + data.toString

      tree.getNode(treeKey) match {
        case null =>
          logger.debug(s"adding new node: $treeKey to parent ${parent.key}")

          val treeKeysByColumn = if (isLeaf)
            parent.keysByColumn
          else
            parent.keysByColumn ++ Map(column.name -> (if (data == null) "" else data.toString))

          val aggregations = Aggregation.createAggregations(groupBy)

          if(isLeaf) parent.processRowForAggregation(row)

          Some(tree.addChild(parent, TreeNodeImpl(isLeaf, treeKey, if (data == null) "" else data.toString, new JList[TreeNode](), parent, parent.depth + 1, treeKeysByColumn, aggregations)))
        case node =>
          logger.debug(s"Node ${treeKey} already exists, just adding to parent:" + parent.key)

          if (!tree.hasChild(parent, node)){
            if(isLeaf) parent.processRowForAggregation(row)
            Some(tree.addChild(parent, node))
          }
          else {
            if(isLeaf) parent.processRowForAggregation(row)

            Some(node)
          }
        //if the child already exists then don't do anything
      }
    }
  }

}
