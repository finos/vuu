package org.finos.vuu.benchmark

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.core.table.{Columns, RowWithData, InMemDataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.core.tree.TreeSessionTable
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.JoinTableProviderImpl
import org.finos.vuu.viewport.GroupBy
import org.finos.vuu.viewport.tree.{BuildEntireTree, TreeBuilder, TreeNodeStateStore}

object BenchmarkHelper {
  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

  val joinProvider = JoinTableProviderImpl() // new EsperJoinTableProviderImpl()
  def createBigTable(rows: Int): InMemDataTable = {
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

    val table = new InMemDataTable(pricesDef, joinProvider)

    (1 to rows).foreach(i => {

      val ric = "TST-" + i

      val exchange = "exchange-" + i

      val row = RowWithData(ric, Map("ric" -> ric, "ask" -> 100, "bid" -> 101, "last" -> 105, "exchange" -> exchange))

      table.processUpdate(ric, row, 1l)
    })
    table
  }

  def createTreeBuilder(table: InMemDataTable): TreeBuilder = {
    val client = ClientSessionId("A", "B")

    val groupByTable = TreeSessionTable(table, client, joinProvider)(metrics, clock)
    val exchange = table.getTableDef.columnForName("exchange")

    val columns = ViewPortColumnCreator.create(groupByTable, table.columns().map(_.name).toList)


    val treeBuilder = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec(""), columns, TreeNodeStateStore(Map()), None, None, buildAction = BuildEntireTree(groupByTable, None), None)
    treeBuilder
  }
}
