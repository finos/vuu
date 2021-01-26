package io.venuu.vuu.core.groupBy

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.groupby.GroupBySessionTable
import io.venuu.vuu.core.table.{Columns, RowWithData, SimpleDataTable, TableContainer}
import io.venuu.vuu.net.{ClientSessionId, FilterSpec}
import io.venuu.vuu.provider.JoinTableProviderImpl
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.viewport.{GroupBy, GroupByTreeBuilder, ViewPortContainer}
import org.scalatest._

/**
  * Created by chris on 10/04/2016.
  */
class BuildBigGroupByTest extends FeatureSpec with Matchers with StrictLogging {

  import io.venuu.toolbox.time.TimeIt._

  feature("check big groupby's"){

    scenario("create big group by and build table"){

      implicit val lifecycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl
      implicit val timeProvider: Clock = new DefaultClock

      val joinProvider   = new JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

//      val outQueue          = new OutboundRowPublishQueue()
//      val highPriorityQueue = new OutboundRowPublishQueue()
//      val viewPortContainer = new ViewPortContainer(tableContainer)

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"), "ric")

      val table = new SimpleDataTable(pricesDef, joinProvider)

      (1 to 100000).foreach( i => {

        val ric = "TST-" + i

        val exchange = if(i % 2 == 0) "A"
        else if(i % 3 == 0) "B"
        else if(i % 4 == 0) "C"
        else "D"

        val row = RowWithData(ric, Map("ask" -> 100, "bid" -> 101, "last" -> 105, "exchange" -> exchange))

        table.processUpdate(ric, row, 1l)
      })

      val client = ClientSessionId("A", "B")

      val groupByTable = GroupBySessionTable(table, client, joinProvider)(metrics)

      val exchange = table.getTableDef.columnForName("exchange")

      val builder = GroupByTreeBuilder(groupByTable, new GroupBy(List(exchange), List()), FilterSpec(""), None)

      logger.info("Starting tree build")

      val (millis, _) = timeIt{ builder.build() }

      logger.info(s"Complete tree build in $millis ms")

      val builder2 = GroupByTreeBuilder(groupByTable, new GroupBy(List(exchange), List()), FilterSpec("exchange = C"), None)

      logger.info("Starting tree build")

      val (millis2, _) = timeIt{ builder2.build() }

      logger.info(s"Complete tree build 2 in $millis2 ms")

    }

  }
}
