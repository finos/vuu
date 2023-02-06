package org.finos.vuu.core.groupBy

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.tree.TreeSessionTable
import org.finos.vuu.core.table.{Columns, RowWithData, SimpleDataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.JoinTableProviderImpl
import org.finos.vuu.viewport.{GroupBy, TreeBuilder}
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}

object PerfTestBigRoupByMain extends App with StrictLogging {

  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

  val joinProvider   = JoinTableProviderImpl()// new EsperJoinTableProviderImpl()

  val tableContainer = new TableContainer(joinProvider)

  //      val outQueue          = new OutboundRowPublishQueue()
  //      val highPriorityQueue = new OutboundRowPublishQueue()
  //      val viewPortContainer = new ViewPortContainer(tableContainer)

  val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"), "ric")

  val table = new SimpleDataTable(pricesDef, joinProvider)

  (1 to 1_000_000).foreach( i => {

    val ric = "TST-" + i

    val exchange = if(i % 2 == 0) "A"
    else if(i % 3 == 0) "B"
    else if(i % 4 == 0) "C"
    else "D"

    val row = RowWithData(ric, Map("ask" -> 100, "bid" -> 101, "last" -> 105, "exchange" -> exchange))

    table.processUpdate(ric, row, 1l)
  })

  val client = ClientSessionId("A", "B")

  val groupByTable = TreeSessionTable(table, client, joinProvider)(metrics, clock)

  val exchange = table.getTableDef.columnForName("exchange")

  val columns = ViewPortColumnCreator.create(groupByTable, table.columns().map(_.name).toList)

  val builder = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec(""), columns, None, None)

  for(a <- 0 until 5000){
    logger.info("Starting tree build")
    val (millis, tree) = timeIt{ builder.build() }
    logger.info(s"Built tree in $millis")
  }

}
