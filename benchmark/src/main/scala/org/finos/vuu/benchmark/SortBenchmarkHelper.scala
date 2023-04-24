package org.finos.vuu.benchmark

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.core.table.{Columns, DataTable, RowWithData, SimpleDataTable, TableContainer}
import org.finos.vuu.provider.JoinTableProviderImpl

object SortBenchmarkHelper {

  def createBigTable(rows: Int): SimpleDataTable = {
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

    val table = new SimpleDataTable(pricesDef, joinProvider)

    (1 to rows).foreach(i => {

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
}
