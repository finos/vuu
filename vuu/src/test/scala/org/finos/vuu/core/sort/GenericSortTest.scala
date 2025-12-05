package org.finos.vuu.core.sort

import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.sort.FilterAndSortFixture.{doSort, setupTable, setupTable2}
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.net.{SortDef, SortSpec}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class GenericSortTest extends AnyFeatureSpec with Matchers {
  implicit val clock: Clock = new TestFriendlyClock(1000)
  private val table = setupTable()
  private val table2 = setupTable2()

  Feature("GenericSort") {
    Scenario("sort `quantity` in ascending order and `orderId` in descending order") {
      expectRows(doSort(table, Sort(SortSpec(List(SortDef("quantity", 'A'), SortDef("orderId", 'D'))), table.columnsForNames("quantity", "orderId")))) {
        List(
          "NYC-0010",
          "NYC-0002",
          "LDN-0008",
          "LDN-0003",
          "LDN-0002",
          "LDN-0001",
          "NYC-0004",
        )
      }
    }

    Scenario("sort `trader` in ascending order and `tradeTime` in descending order") {
      expectRows(doSort(table, Sort(SortSpec(List(SortDef("trader", 'A'), SortDef("tradeTime", 'D'))), table.columnsForNames("trader", "tradeTime")))) {
        List(
          "NYC-0004",
          "LDN-0008",
          "LDN-0003",
          "LDN-0001",
          "NYC-0002",
          "NYC-0010",
          "LDN-0002",
        )
      }
    }

    Scenario("sort `trader` in descending order and `tradeTime` in ascending order") {
      expectRows(doSort(table, Sort(SortSpec(List(SortDef("trader", 'D'), SortDef("tradeTime", 'A'))), table.columnsForNames("trader", "tradeTime")))) {
        List(
          "LDN-0002",
          "NYC-0002",
          "NYC-0010",
          "LDN-0001",
          "LDN-0003",
          "NYC-0004",
          "LDN-0008"
        )
      }
    }

    Scenario("sort `tradeTime` in descending order") {
      expectRows(doSort(table, Sort(SortSpec(List(SortDef("tradeTime", 'D'))), table.columnsForNames("tradeTime")))) {
        List(
          "NYC-0002",
          "NYC-0010",
          "NYC-0004",
          "LDN-0008",
          "LDN-0003",
          "LDN-0001",
          "LDN-0002",
        )
      }
    }

    Scenario("sort `quantity` in descending order") {
      expectRows(doSort(table2, Sort(SortSpec(List(SortDef("quantity", 'D'))), table2.columnsForNames("quantity")))) {
        List(
          "NYC-0004",
          "LDN-0003",
          "NYC-0010",
          "NYC-0012",
          "NYC-0013",
          "NYC-0011",
          "LDN-0001",
          "LDN-0002",
          "LDN-0008",
          "NYC-0002",
        )
      }
    }
  }

  def expectRows(actual: List[(String, RowWithData)])(expectedFn: => List[String]): Unit =
    actual.map(_._2.key) shouldEqual expectedFn
}
