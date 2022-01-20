package io.venuu.vuu.core.groupBy

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.TimeIt.timeIt
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.tree.TreeSessionTable
import io.venuu.vuu.core.table.{Columns, RowWithData, SimpleDataTable, TableContainer}
import io.venuu.vuu.net.{ClientSessionId, FilterSpec}
import io.venuu.vuu.provider.JoinTableProviderImpl
import io.venuu.vuu.viewport.{GroupBy, TreeBuilder}

object PerfTestBigRoupByMain extends App with StrictLogging {

  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle = new LifecycleContainer
  implicit val metrics = new MetricsProviderImpl

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

  val builder = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec(""), None)

  for(a <- 0 until 5000){
    logger.info("Starting tree build")
    val (millis, tree) = timeIt{ builder.build() }
    logger.info(s"Built tree in $millis")
  }

}
