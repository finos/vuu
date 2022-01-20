package io.venuu.vuu.core.groupBy

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.tree.TreeSessionTable
import io.venuu.vuu.core.table.{Columns, RowWithData, SimpleDataTable, TableContainer}
import io.venuu.vuu.net.{ClientSessionId, FilterSpec}
import io.venuu.vuu.provider.JoinTableProviderImpl
import io.venuu.vuu.viewport.{GroupBy, TreeBuilder}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

/**
  * Created by chris on 10/04/2016.
  */
class BuildBigGroupByTest extends AnyFeatureSpec with Matchers with StrictLogging {

  import io.venuu.toolbox.time.TimeIt._

  Feature("check big groupby's"){

    ignore("create big group by and build table"){

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

      (1 to 100_000).foreach( i => {

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

      logger.info("Starting tree build")

      val (millis, tree) = timeIt{ builder.build() }

      logger.info(s"Complete tree build in $millis ms")

      val builder2 = TreeBuilder.create(groupByTable, new GroupBy(List(exchange), List()), FilterSpec("exchange = C"), None)

      val (sizeMillis, _) = timeIt{ groupByTable.size() }

      logger.info(s"Calling size on groupBy: $sizeMillis ms")

      logger.info("Starting tree build")

      val (millis2, _) = timeIt{ builder2.build() }

      logger.info(s"Complete tree build 2 in $millis2 ms")
    }

  }
}
