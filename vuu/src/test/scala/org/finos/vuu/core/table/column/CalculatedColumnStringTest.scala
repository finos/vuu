package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.column.CalculatedColumnFixture._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class CalculatedColumnStringTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("Check String functions") {

  }

  Scenario("Check left") {
    //check what happens when we submit garbage column names
    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("leftTest", "String", "=left(trader, 2)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "leftTest"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "nu"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "ch"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "st"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "ch"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "ch"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "nu"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "st"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "st"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "st"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "ra")
      )
    }
  }

  Scenario("Check right") {
    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("rightTest", "String", "=right(trader, 2)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "rightTest"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "ll"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "is"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "ve"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "is"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "is"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "ll"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "ve"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "ve"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "ve"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "úl")
      )
    }
  }

  Scenario("Check right overflow") {

    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("rightTest", "String", "=right(trader, 15)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "rightTest"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "null"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "chris"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "steve"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "chris"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "chris"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "null"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "steve"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "steve"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "steve"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "rahúl")
      )
    }
  }

  Scenario("Check right nested func") {

    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("rightTest", "String", "=right(concatenate(trader, ric), 8)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "rightTest"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "llAAPL.L"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "risVOD.L"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "teveBT.L"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "risVOD.L"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "hrisBT.L"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "ullVOD.L"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "eveVOD.L"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "eveVOD/L"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "eveVOD\\L"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "húlVOD\\L")
      )
    }
  }

  Scenario("Check string literal concat") {

    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("concat", "String", "=concatenate(\"Foo bar ding    dong \", ric)")
    ) {
      Table(
        ("orderId" ,"quantity","ric"     ,"tradeTime","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","concat"  ),
        ("NYC-0004",null      ,"AAPL.L"  ,5L        ,99.0      ,101.5     ,false     ,null      ,"GBPUSD"  ,-0.1234   ,"Foo bar ding    dong AAPL.L"),
        ("LDN-0001",100L      ,"VOD.L"   ,2L        ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"Foo bar ding    dong VOD.L"),
        ("LDN-0002",100L      ,"BT.L"    ,1L        ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"Foo bar ding    dong BT.L"),
        ("LDN-0003",null      ,"VOD.L"   ,3L        ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"Foo bar ding    dong VOD.L"),
        ("LDN-0008",100L      ,"BT.L"    ,5L        ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"Foo bar ding    dong BT.L"),
        ("NYC-0002",100L      ,"VOD.L"   ,6L        ,99.0      ,102.0     ,false     ,null      ,"GBPUSD"  ,1.1234    ,"Foo bar ding    dong VOD.L"),
        ("NYC-0010",null      ,"VOD.L"   ,6L        ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"Foo bar ding    dong VOD.L"),
        ("NYC-0011",null      ,"VOD/L"   ,6L        ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"Foo bar ding    dong VOD/L"),
        ("NYC-0012",null      ,"VOD\\L"   ,6L        ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"Foo bar ding    dong VOD\\L"),
        ("NYC-0013",null      ,"VOD\\L"   ,6L        ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,"Foo bar ding    dong VOD\\L")
      )
    }
  }

  Scenario("Check upper") {

    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("upperTest", "String", "=upper(trader)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "upperTest"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "NULL"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "CHRIS"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "STEVE"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "CHRIS"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "CHRIS"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "NULL"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "STEVE"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "STEVE"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "STEVE"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "RAHÚL")
      )
    }
  }

  Scenario("Check lower") {

    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("lowerTest", "String", "=lower(ric)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "lowerTest"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "aapl.l"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "vod.l"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "bt.l"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "vod.l"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "bt.l"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "vod.l"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "vod.l"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "vod/l"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "vod\\l"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "vod\\l")
      )
    }
  }

  Scenario("Check lower with concat") {

    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("lowerTest", "String", "=lower(ric, orderId)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "lowerTest"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "aapl.lnyc-0004"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "vod.lldn-0001"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "bt.lldn-0002"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "vod.lldn-0003"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "bt.lldn-0008"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "vod.lnyc-0002"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "vod.lnyc-0010"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "vod/lnyc-0011"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "vod\\lnyc-0012"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "vod\\lnyc-0013")
      )
    }
  }

  Scenario("Check replace") {

    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("replaceTest", "String", "=replace(trader, \"chris\", \"milan\")")
    ) {

      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "replaceTest"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "null"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "milan"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "steve"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "milan"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "milan"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "null"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "steve"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "steve"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "steve"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "rahúl")
      )
    }

  }



  Scenario("Check calculation error scenarios") {
    //check what happens when we submit garbage column names
    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("nullConcat", "String", "=concatenate(foo, bar)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "nullConcat"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar "),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "Error:Column not found:foo Error:Column not found:bar ")
      )
    }
  }

    Scenario("Check concat 2") {
      withCalculatedColumns(sampleRows(), tableColumns, CalcColumn("traderCcy", "String", "=concatenate(trader, ccyCross)")) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "traderCcy"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, "chrisGBPUSD"),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD"),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD"),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD"),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "rahúl$GBPUSD")
        )
      }
    }

  Scenario("Check concat on concat") {

    //at the moment, if you are doing calculations of calculations they have to be in sequence, it doesn't work out the dependency graph
    withCalculatedColumns(sampleRows(), tableColumns,
      CalcColumn("traderCcy", "String", "=concatenate(trader, ccyCross)"),
      CalcColumn("traderCcyRic", "String", "=concatenate(traderCcy, ric)")) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "traderCcy", "traderCcyRic"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, "chrisGBPUSD", "chrisGBPUSDAAPL.L"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD", "chrisGBPUSDVOD.L"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD", "steveGBPUSDBT.L"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD", "chrisGBPUSDVOD.L"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD", "chrisGBPUSDBT.L"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, "steveGBPUSD", "steveGBPUSDVOD.L"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD", "steveGBPUSDVOD.L"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD", "steveGBPUSDVOD/L"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD", "steveGBPUSDVOD\\L"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "rahúl$GBPUSD", "rahúl$GBPUSDVOD\\L")
      )
    }
  }

  Scenario("Check concat null") {

    //null handling
    withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
      CalcColumn("nullConcat", "String", "=concatenate(trader, ric)")
    ) {
      Table(
        ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "nullConcat"),
        ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, "nullAAPL.L"),
        ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "chrisVOD.L"),
        ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "steveBT.L"),
        ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "chrisVOD.L"),
        ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "chrisBT.L"),
        ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, "nullVOD.L"),
        ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "steveVOD.L"),
        ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "steveVOD/L"),
        ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "steveVOD\\L"),
        ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "rahúlVOD\\L")
      )
    }
  }

}
