package io.venuu.vuu.core.sort

import io.venuu.vuu.core.table.RowWithData
import io.venuu.vuu.net.{SortDef, SortSpec}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class GenericSortTest extends AnyFeatureSpec with Matchers {

  import FilterAndSortFixture._

  Feature("test scala sorts") {

    Scenario("test a numeric scala sort") {

      val table = setupTable

      expectRows(doSort(table, GenericSort(SortSpec(List(SortDef("quantity", 'A'), SortDef("orderId", 'D'))), table.columnsForNames("quantity", "orderId")))) {
        List(
          RowWithData("NYC-0004", Map("tradeTime" -> 5l, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0001", Map("tradeTime" -> 2l, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0002", Map("tradeTime" -> 1l, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0003", Map("tradeTime" -> 3l, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0008", Map("tradeTime" -> 5l, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0002", Map("tradeTime" -> 6l, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0010", Map("tradeTime" -> 6l, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"))
        )
      }

      expectRows(doSort(table, GenericSort(SortSpec(List(SortDef("trader", 'A'), SortDef("tradeTime", 'D'))), table.columnsForNames("trader", "tradeTime")))) {
        List(
          RowWithData("LDN-0002",Map("tradeTime" -> 1l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0002",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0002","onMkt" -> false,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0010",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0010","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0001",Map("tradeTime" -> 2l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0001","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0003",Map("tradeTime" -> 3l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0003","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0004",Map("tradeTime" -> 5l,"quantity" -> 500.0d,"ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD"))
        )
      }

      expectRows(doSort(table, GenericSort(SortSpec(List(SortDef("trader", 'D'), SortDef("tradeTime", 'A'))), table.columnsForNames("trader", "tradeTime")))) {
        List(
          RowWithData("NYC-0004",Map("tradeTime" -> 5l,"quantity" -> 500.0d,"ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0003",Map("tradeTime" -> 3l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0003","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0001",Map("tradeTime" -> 2l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0001","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0002",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0002","onMkt" -> false,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0010",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0010","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0002",Map("tradeTime" -> 1l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD"))
        )

      }

      expectRows(doSort(table, GenericSort(SortSpec(List(SortDef("tradeTime", 'D') )), table.columnsForNames("tradeTime")))) {
        List(
          RowWithData("LDN-0002",Map("tradeTime" -> 1l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0001",Map("tradeTime" -> 2l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0001","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0003",Map("tradeTime" -> 3l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0003","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0004",Map("tradeTime" -> 5l,"quantity" -> 500.0d,"ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0002",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0002","onMkt" -> false,"trader" -> "steve","ccyCross" -> "GBPUSD")),
          RowWithData("NYC-0010",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0010","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD"))
        )
      }

      val table2 = setupTable2

      expectRows(doSort(table2, GenericSort(SortSpec(List(SortDef("quantity", 'D') )), table2.columnsForNames("quantity")))) {
        List(
          RowWithData("NYC-0004",Map("ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD","tradeTime" -> 5l,"quantity" -> null)),
          RowWithData("LDN-0003",Map("ric" -> "VOD.L","orderId" -> "LDN-0003","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD","tradeTime" -> 3l,"quantity" -> null)),
          RowWithData("NYC-0010",Map("ric" -> "VOD.L","orderId" -> "NYC-0010","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0011",Map("ric" -> "VOD/L","orderId" -> "NYC-0011","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0012",Map("ric" -> "VOD\\L","orderId" -> "NYC-0012","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("NYC-0013",Map("ric" -> "VOD\\L","orderId" -> "NYC-0013","onMkt" -> true,"trader" -> "rahúl","ccyCross" -> "$GBPUSD","tradeTime" -> 6l,"quantity" -> null)),
          RowWithData("LDN-0001",Map("ric" -> "VOD.L","orderId" -> "LDN-0001","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD","tradeTime" -> 2l,"quantity" -> 100.0d)),
          RowWithData("LDN-0002",Map("ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 1l,"quantity" -> 100.0d)),
          RowWithData("LDN-0008",Map("ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD","tradeTime" -> 5l,"quantity" -> 100.0d)),
          RowWithData("NYC-0002",Map("ric" -> "VOD.L","orderId" -> "NYC-0002","onMkt" -> false,"trader" -> "steve","ccyCross" -> "GBPUSD","tradeTime" -> 6l,"quantity" -> 100.0d))
        )
      }

    }
  }
}
