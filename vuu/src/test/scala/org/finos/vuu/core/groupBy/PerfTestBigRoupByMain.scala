package org.finos.vuu.core.groupBy

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.filter.`type`.AllowAllPermissionFilter
import org.finos.vuu.core.table.*
import org.finos.vuu.core.tree.TreeSessionTable
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.JoinTableProviderImpl
import org.finos.vuu.viewport.GroupBy
import org.finos.vuu.viewport.tree.{BuildEntireTree, TreeBuilder, TreeNodeStateStore}

object PerfTestBigRoupByMain extends App with StrictLogging {

  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

  val joinProvider   = JoinTableProviderImpl()

  val tableContainer = new TableContainer(joinProvider)

  //      val outQueue          = new OutboundRowPublishQueue()
  //      val highPriorityQueue = new OutboundRowPublishQueue()
  //      val viewPortContainer = new ViewPortContainer(tableContainer)

  val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"), "ric")

  val table = new InMemDataTable(pricesDef, joinProvider)

  (1 to 1_000_000).foreach( i => {

    val ric = "TST-" + i

    val exchange = if(i % 2 == 0) "A"
    else if(i % 3 == 0) "B"
    else if(i % 4 == 0) "C"
    else "D"

    val row = RowWithData(ric, Map("ask" -> 100, "bid" -> 101, "last" -> 105, "exchange" -> exchange))

    table.processUpdate(ric, row)
  })

  val client = ClientSessionId("A", "C")

  val groupByTable = TreeSessionTable(table, client, joinProvider)(metrics, clock)

  val exchange = table.getTableDef.columnForName("exchange")

  val columns = ViewPortColumnCreator.create(groupByTable, table.columns().map(_.name).toList)

  val builder = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec(""), columns,
    TreeNodeStateStore(Map()), None, None, buildAction = BuildEntireTree(groupByTable, None), AllowAllPermissionFilter, None)

  for(a <- 0 until 5000){
    logger.debug("Starting tree build")
    val (millis, tree) = timeIt{ builder.buildEntireTree() }
    logger.debug(s"Built tree in $millis")
  }

}
