package org.finos.vuu.table.virtualized

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.table.{Columns, RowData, RowWithData}
import org.finos.vuu.feature.ignite.api.IgniteSessionTableDef
import org.finos.vuu.feature.ignite.table.IgniteVirtualizedSessionTable
import org.finos.vuu.feature.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.test.TestFriendlyJoinTableProvider
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers


class VirtualizedDataTableTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  def sampleRows: List[RowWithData] = {
    List(
      RowWithData("0001", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 100, "trader" -> "trader1")),
      RowWithData("0002", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 200, "trader" -> "trader1")),
      RowWithData("0003", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 300, "trader" -> "trader1")),
      RowWithData("0004", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 400, "trader" -> "trader1")),
      RowWithData("0005", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 500, "trader" -> "trader1")),
      RowWithData("0006", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 600, "trader" -> "trader1")),
      RowWithData("0007", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 700, "trader" -> "trader1")),
      RowWithData("0008", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 800, "trader" -> "trader1")),
      RowWithData("0009", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 900, "trader" -> "trader1")),
      RowWithData("0010", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 1000, "trader" -> "trader1"))
    )
  }

  Feature("verify contract for virtualized table") {

    Scenario("test adding data") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val clock: Clock = new TestFriendlyClock(DefaultTestStartTime.TestStartTime)

      val sessionId = ClientSessionId("AAAA", "user")
      val joinProvider = new TestFriendlyJoinTableProvider

      val tableDef = VirtualizedSessionTableDef("bigOrders", "orderId", Columns.fromNames("orderId:String", "ric:String", "quantity:Int", "trader: String"))

      val virtualizedTable = new VirtualizedSessionTable(sessionId, tableDef, joinProvider)

      When("we tick in rows into the table")
      virtualizedTable.withBatch(VirtualizedRange(0, 10, 100_000), table => {
        sampleRows.foreach( row => table.processUpdate(row.key, row, clock.now()))
      })

      virtualizedTable.length should equal(100_000)

      virtualizedTable.primaryKeys

    }

  }
}
