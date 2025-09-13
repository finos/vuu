package org.finos.vuu.core.sort

import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.net.{SortDef, SortSpec}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import FilterAndSortFixture.{doSort, setupTable, setupTable2}
import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}

class GenericSortTest extends AnyFeatureSpec with Matchers {
  implicit val clock: Clock = new TestFriendlyClock(1000)
  private val table = setupTable()
  private val table2 = setupTable2()

  Feature("GenericSort") {
    Scenario("sort `quantity` in ascending order and `orderId` in descending order") {
      expectRows(doSort(table, SortImpl(SortSpec(List(SortDef("quantity", 'A'), SortDef("orderId", 'D'))), table.columnsForNames("quantity", "orderId")))) {
        List(
          RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7))),
          RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6))),
          RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5))),
          RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4))),
          RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3))),
          RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2))),
          RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1))),
        )
      }
    }

    Scenario("sort `trader` in ascending order and `tradeTime` in descending order") {
      expectRows(doSort(table, SortImpl(SortSpec(List(SortDef("trader", 'A'), SortDef("tradeTime", 'D'))), table.columnsForNames("trader", "tradeTime")))) {
        List(
          RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1))),
          RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5))),
          RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4))),
          RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2))),
          RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6))),
          RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7))),
          RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3))),
        )
      }
    }

    Scenario("sort `trader` in descending order and `tradeTime` in ascending order") {
      expectRows(doSort(table, SortImpl(SortSpec(List(SortDef("trader", 'D'), SortDef("tradeTime", 'A'))), table.columnsForNames("trader", "tradeTime")))) {
        List(
          RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3))),
          RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6))),
          RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7))),
          RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2))),
          RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4))),
          RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1))),
          RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5))),
        )
      }
    }

    Scenario("sort `tradeTime` in descending order") {
      expectRows(doSort(table, SortImpl(SortSpec(List(SortDef("tradeTime", 'D'))), table.columnsForNames("tradeTime")))) {
        List(
          RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6))),
          RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7))),
          RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1))),
          RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5))),
          RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4))),
          RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2))),
          RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3))),
        )
      }
    }

    Scenario("sort `lastUpdated` in descending order") {
      expectRows(doSort(table, SortImpl(SortSpec(List(SortDef("lastUpdated", 'D'))), table.columnsForNames("lastUpdated")))) {
        List(
          RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7))),
          RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6))),
          RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5))),
          RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4))),
          RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3))),
          RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2))),
          RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1))),
        )
      }
    }

    Scenario("sort `price` in ascending order") {
      expectRows(doSort(table, SortImpl(SortSpec(List(SortDef("price", 'A'))), table.columnsForNames("price")))) {
        List(
          RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2))),
          RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4))),
          RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6))),
          RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7))),
          RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3))),
          RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5))),
          RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1))),
        )
      }
    }

    Scenario("sort `quantity` in descending order") {
      expectRows(doSort(table2, SortImpl(SortSpec(List(SortDef("quantity", 'D'))), table2.columnsForNames("quantity")))) {
        List(
          RowWithData("NYC-0011", Map("ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 105.0d, "price" -> Decimal(87.16), "lastUpdated" -> EpochTimestamp(8))),
          RowWithData("LDN-0001", Map("ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 2L, "quantity" -> 100.0d, "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2))),
          RowWithData("LDN-0002", Map("ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 1L, "quantity" -> 100.0d, "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3))),
          RowWithData("LDN-0008", Map("ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> 100.0d, "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5))),
          RowWithData("NYC-0002", Map("ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 100.0d, "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6))),
          RowWithData("NYC-0004", Map("ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> null, "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1))),
          RowWithData("LDN-0003", Map("ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 3L, "quantity" -> null, "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4))),
          RowWithData("NYC-0010", Map("ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null, "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7))),
          RowWithData("NYC-0012", Map("ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null, "price" -> Decimal(87.17), "lastUpdated" -> EpochTimestamp(9))),
          RowWithData("NYC-0013", Map("ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "tradeTime" -> 6L, "quantity" -> null, "price" -> Decimal(87.18), "lastUpdated" -> EpochTimestamp(10))),
        )
      }
    }
  }

  def expectRows(actual: List[(String, RowWithData)])(expectedFn: => List[RowWithData]): Unit =
    actual.map(_._2) shouldEqual expectedFn
}
