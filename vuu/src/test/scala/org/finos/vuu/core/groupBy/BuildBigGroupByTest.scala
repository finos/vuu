package org.finos.vuu.core.groupBy

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.core.tree.{TreeSessionTable, TreeSessionTableImpl}
import org.finos.vuu.core.table.{Column, Columns, RowWithData, SimpleDataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.{JoinTableProvider, JoinTableProviderImpl}
import org.finos.vuu.viewport.{GroupBy, ViewPortColumns}
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.groupBy.PerfTestBigRoupByMain.groupByTable
import org.finos.vuu.viewport.tree.{OpenTreeNodeState, Tree, TreeBuilder, TreeNodeStateStore}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

object BuildBigGroupByTestMain {

  def main(args: Array[String]): Unit = {
    val scenario = new BuildBigGroupByTestScenario()
    scenario.run()
  }
}

class BuildBigGroupByTestScenario() extends StrictLogging {

  def buildTable(pricesDef: TableDef, joinProvider: JoinTableProvider)(implicit metrics: MetricsProviderImpl) = {
    val table = new SimpleDataTable(pricesDef, joinProvider)

    (1 to 2_000_000).foreach(i => {

      val ric = "TST-" + i

      val exchange = if (i % 2 == 0) "A"
      else if (i % 3 == 0) "B"
      else if (i % 4 == 0) "C"
      else "D"

      val row = RowWithData(ric, Map("ask" -> 100, "bid" -> 101, "last" -> 105, "exchange" -> exchange))

      table.processUpdate(ric, row, 1l)
    })

    table
  }

  def buildTree(table: TreeSessionTableImpl, exchange: Column, columns: ViewPortColumns, previousTree: Option[Tree])(implicit clock: Clock): Tree = {

    val builder = TreeBuilder.create(table, new GroupBy(List(exchange), List()), FilterSpec(""), columns, TreeNodeStateStore(Map()), previousTree, None)

    logger.info("[PERF] Starting tree build")

    val (millis, tree) = timeIt {
      builder.build()
    }

    logger.info(s"[PERF] Starting tree build took ${millis}")

    tree
  }

  def buildTreeWithFilter(table: TreeSessionTableImpl, exchange: Column, columns: ViewPortColumns, previousTree: Option[Tree], filter: String)(implicit clock: Clock): Tree = {

    val builder = TreeBuilder.create(table, new GroupBy(List(exchange), List()), FilterSpec(filter), columns, TreeNodeStateStore(Map()), previousTree, None)

    logger.info("[PERF] Starting tree build with filter")

    val (millis, tree) = timeIt {
      builder.build()
    }

    logger.info(s"[PERF] Starting tree with filter build took ${millis}")

    tree
  }

  def treeToKeys(tree: Tree)(implicit clock: Clock): Unit = {
    logger.info("[PERF] Starting tree to keys")
    val (millis, keys) = timeIt {
      tree.toKeys()
    }
    logger.info(s"[PERF] Complete tree to keys in ${millis} size ${keys.length}")
  }


  def run(): Unit = {
    implicit val clock: Clock = new DefaultClock
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer
    implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

    val joinProvider = JoinTableProviderImpl() // new EsperJoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val pricesDef = TableDef(
      "prices", "ric",
      Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"),
      indices = Indices(
        Index("exchange")
      ),
      "ric"
    )

    logger.info("[PERF] Starting perf test, building flat table....")

    val table = buildTable(pricesDef, joinProvider)

    logger.info("[PERF] Complete Table Build")

    val client = ClientSessionId("A", "B")

    val groupByTable = TreeSessionTable(table, client, joinProvider)(metrics, clock)

    val exchange = table.getTableDef.columnForName("exchange")

    val columns = ViewPortColumnCreator.create(groupByTable, groupByTable.columns().map(_.name).toList)

    val builder = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec(""), columns, TreeNodeStateStore(Map()), None, None)

    val tree = buildTree(groupByTable, exchange, columns, None)

    val tree2 = buildTree(groupByTable, exchange, columns, Some(tree))

    val tree3 = buildTreeWithFilter(groupByTable, exchange, columns, Some(tree), "exchange = \"A\"")

    treeToKeys(tree3)

    val tree4 = tree3.applyNewNodeState(TreeNodeStateStore(Map("$root|A"-> OpenTreeNodeState)))

    treeToKeys(tree4)
  }

}

class BuildBigGroupByTest extends AnyFeatureSpec with Matchers with StrictLogging {

  import org.finos.toolbox.time.TimeIt._

  Feature("check big groupby's") {

    ignore("create big group by and build table") {
      new BuildBigGroupByTestScenario().run()
    }
  }
}
