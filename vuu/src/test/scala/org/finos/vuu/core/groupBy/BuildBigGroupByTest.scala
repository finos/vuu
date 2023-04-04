package org.finos.vuu.core.groupBy

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.core.tree.TreeSessionTable
import org.finos.vuu.core.table.{Columns, RowWithData, SimpleDataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.JoinTableProviderImpl
import org.finos.vuu.viewport.GroupBy
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.viewport.tree.{TreeBuilder, TreeNodeStateStore}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

object BuildBigGroupByTestMain {

  def main(args: Array[String]): Unit = {
    val scenario = new BuildBigGroupByTestScenario()
    scenario.run()
  }
}

class BuildBigGroupByTestScenario() extends StrictLogging {

  def run(): Unit = {
    implicit val clock: Clock = new DefaultClock
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer
    implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

    val joinProvider = JoinTableProviderImpl() // new EsperJoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    //      val outQueue          = new OutboundRowPublishQueue()
    //      val highPriorityQueue = new OutboundRowPublishQueue()
    //      val viewPortContainer = new ViewPortContainer(tableContainer)

    val pricesDef = TableDef(
      "prices", "ric",
      Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"),
      indices = Indices(
        Index("exchange")
      ),
      "ric"
    )

    logger.info("[PERF] Starting perf test, building flat table....")

    val table = new SimpleDataTable(pricesDef, joinProvider)

    (1 to 5_000_000).foreach(i => {

      val ric = "TST-" + i

      val exchange = if (i % 2 == 0) "A"
      else if (i % 3 == 0) "B"
      else if (i % 4 == 0) "C"
      else "D"

      val row = RowWithData(ric, Map("ask" -> 100, "bid" -> 101, "last" -> 105, "exchange" -> exchange))

      table.processUpdate(ric, row, 1l)
    })

    logger.info("[PERF] Complete Table Build")

    val client = ClientSessionId("A", "B")

    val groupByTable = TreeSessionTable(table, client, joinProvider)(metrics, clock)

    val exchange = table.getTableDef.columnForName("exchange")

    val columns = ViewPortColumnCreator.create(groupByTable, groupByTable.columns().map(_.name).toList)

    val builder = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec(""), columns, TreeNodeStateStore(Map()), None, None)

    logger.info("[PERF] Starting tree build")

    val (millis, tree) = timeIt {
      builder.build()
    }

    logger.info(s"[PERF] Complete tree build in $millis ms")

    val builder3 = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec(""), columns, TreeNodeStateStore(Map()), Some(tree), None)

    logger.info("[PERF] Starting tree build 3")

    val (millis3, tree3) = timeIt {
      builder3.build()
    }

    logger.info(s"[PERF] Complete tree build in $millis3 ms")

    val builder2 = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec("exchange = \"A\""), columns, TreeNodeStateStore(Map()), Some(tree3), None)

    val (sizeMillis, _) = timeIt {
      groupByTable.size()
    }

    logger.info(s"[PERF] Calling size on groupBy: $sizeMillis ms")

    logger.info("[PERF] Starting tree build")

    val (millis2, tree2) = timeIt {
      builder2.build()
    }

    logger.info(s"[PERF] Complete tree build 2 in $millis2 ms done")

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
