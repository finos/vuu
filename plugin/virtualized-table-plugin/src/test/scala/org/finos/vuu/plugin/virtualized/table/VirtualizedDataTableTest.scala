package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.table.{Columns, RowWithData}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.test.TestFriendlyJoinTableProvider
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers


class VirtualizedDataTableTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  private implicit val metrics: MetricsProvider = new MetricsProviderImpl
  private implicit val clock: Clock = new TestFriendlyClock(DefaultTestStartTime.TestStartTime)

  private val sessionId = ClientSessionId("AAAA", "channel")
  private val joinProvider = new TestFriendlyJoinTableProvider

  private val ordersTableDef = VirtualizedSessionTableDef("bigOrders", "orderId", Columns.fromNames("orderId:String", "ric:String", "quantity:Int", "trader: String"))

  def sampleRows: List[RowWithData] = {
    List(
      RowWithData("0001", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 100, "trader" -> "trader1")),
      RowWithData("0002", Map("orderId" -> "0002", "ric" -> "VOD.L", "quantity" -> 200, "trader" -> "trader1")),
      RowWithData("0003", Map("orderId" -> "0003", "ric" -> "VOD.L", "quantity" -> 300, "trader" -> "trader1")),
      RowWithData("0004", Map("orderId" -> "0004", "ric" -> "VOD.L", "quantity" -> 400, "trader" -> "trader1")),
      RowWithData("0005", Map("orderId" -> "0005", "ric" -> "VOD.L", "quantity" -> 500, "trader" -> "trader1")),
      RowWithData("0006", Map("orderId" -> "0006", "ric" -> "VOD.L", "quantity" -> 600, "trader" -> "trader1")),
      RowWithData("0007", Map("orderId" -> "0007", "ric" -> "VOD.L", "quantity" -> 700, "trader" -> "trader1")),
      RowWithData("0008", Map("orderId" -> "0008", "ric" -> "VOD.L", "quantity" -> 800, "trader" -> "trader1")),
      RowWithData("0009", Map("orderId" -> "0009", "ric" -> "VOD.L", "quantity" -> 900, "trader" -> "trader1")),
      RowWithData("0010", Map("orderId" -> "0010", "ric" -> "VOD.L", "quantity" -> 1000, "trader" -> "trader1"))
    )
  }

  def sampleRows2: List[(Int, RowWithData)] = {
    List(
      (10,  RowWithData("0011", Map("orderId" -> "0011", "ric" -> "VOD.L", "quantity" -> 100, "trader" -> "trader1"))),
      (11, RowWithData("0012", Map("orderId" -> "0012", "ric" -> "VOD.L", "quantity" -> 200, "trader" -> "trader1"))),
      (12, RowWithData("0013", Map("orderId" -> "0013", "ric" -> "VOD.L", "quantity" -> 300, "trader" -> "trader1"))),
      (13, RowWithData("0014", Map("orderId" -> "0014", "ric" -> "VOD.L", "quantity" -> 400, "trader" -> "trader1"))),
      (14, RowWithData("0015", Map("orderId" -> "0015", "ric" -> "VOD.L", "quantity" -> 500, "trader" -> "trader1"))),
      (15, RowWithData("0016", Map("orderId" -> "0016", "ric" -> "VOD.L", "quantity" -> 600, "trader" -> "trader1"))),
      (16, RowWithData("0017", Map("orderId" -> "0017", "ric" -> "VOD.L", "quantity" -> 700, "trader" -> "trader1"))),
      (17, RowWithData("0018", Map("orderId" -> "0018", "ric" -> "VOD.L", "quantity" -> 800, "trader" -> "trader1"))),
      (18, RowWithData("0019", Map("orderId" -> "0019", "ric" -> "VOD.L", "quantity" -> 900, "trader" -> "trader1"))),
      (19, RowWithData("0020", Map("orderId" -> "0020", "ric" -> "VOD.L", "quantity" -> 1000, "trader" -> "trader1")))
    )
  }

  Feature("verify contract for virtualized table") {

    Scenario("test adding data") {

      When("we create a virtualized table")
      val virtualizedTable = new VirtualizedSessionTable(sessionId, ordersTableDef, joinProvider, cacheSize = 10)

      And("we set the range (i.e. the cached amount) to between 0 and 10")
      virtualizedTable.setRange(VirtualizedRange(0, 10))

      And("we set the total data set size to 1_000 (i.e. there is lots of data we haven't cached)")
      virtualizedTable.setSize(1_000)

      Then("we tick in the rows from 0 to 10 (exclusive)")
      sampleRows.zipWithIndex.foreach({case(row, index) => virtualizedTable.processUpdateForIndex(index, row.key, row, clock.now())})

      And("we check that the primary keys are what we expect, in order...")
      val primaryKeys = virtualizedTable.primaryKeys.toArray

      primaryKeys should equal( Array(
        "0001", "0002", "0003", "0004", "0005",
        "0006", "0007", "0008", "0009", "0010"
      ))

      And("if we move the range (this would happen if the user moved the viewport a long way away from the table cache)")
      virtualizedTable.setRange(VirtualizedRange(5, 15))

      val primaryKeys2 = virtualizedTable.primaryKeys.toArray

      Then("we verify we don't have the data in the cache")
      primaryKeys2 should equal(
        Array("0006", "0007", "0008", "0009", "0010", null, null, null, null, null)
      )

      And("What would happen next is our loading process would then run on a thread"
        + " this would execute something like select index=5 to index=15 from orders"
        + " this would return back our new keys"
      )

      Then("we would tick them into the table")
      sampleRows2.foreach({case(index, row) => virtualizedTable.processUpdateForIndex(index, row.key, row, clock.now())})

      val primaryKeys3 = virtualizedTable.primaryKeys.toArray

      Then("we verify we do have the update keys in our cache")
      primaryKeys3 should equal(
        Array("0006", "0007", "0008", "0009", "0010", "0011", "0012", "0013", "0014", "0015")
      )

    }
  }

  Feature("hasRowChangedAtIndex") {
    val table = new VirtualizedSessionTable(sessionId, ordersTableDef, joinProvider)
    table.setRange(VirtualizedRange(0, 2))

    val row1 = RowWithData("0001", Map("orderId" -> "0001", "ric" -> "VOD.L", "quantity" -> 100, "trader" -> "trader1"))
    val row2 = RowWithData("0002", Map("orderId" -> "0002", "ric" -> "VOD.L", "quantity" -> 200, "trader" -> "trader2"))
    List(row1, row2).zipWithIndex.foreach({ case (row, i) => table.processUpdateForIndex(i, row.key, row, clock.now())})

    Scenario("WHEN only row data changes THEN should return true") {
      val newRowAtZeroIndex = row1.copy(data = row1.data ++ Map("quantity" -> 105))
      table.hasRowChangedAtIndex(0, newRowAtZeroIndex) should equal(true)
    }

    Scenario("WHEN row is the same but the index changes THEN should return true") {
      table.hasRowChangedAtIndex(1, row1) should equal(true)
    }

    Scenario("WHEN row data is the same but key changes THEN should return true") {
      val sameRowWithDifferentKey = row1.copy(key = "000X")
      table.hasRowChangedAtIndex(0, sameRowWithDifferentKey) should equal(true)
    }

    Scenario("WHEN row as well as the row index are the same THEN should return false") {
      table.hasRowChangedAtIndex(0, row1.copy()) should equal(false)
    }
  }
}
