package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.column.CalculatedColumnFixture._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class CalculatedColumnLogicTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("Check logic based calc clolumns") {

    Scenario("Check if with nested min"){

    withCalculatedColumns(sampleRowsLotsOfNullsMaths(), tableColumns,
      CalcColumn("refCol", "Double", "=quantity / bid"),
      CalcColumn("minTest", "Double", "=if(quantity=500, 2407, min(50, quantity / bid))"),
    ) {
      Table(
        ("orderId" ,"quantity","ric"     ,"tradeTime","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","refCol"  ,"minTest" ),
        ("NYC-0004",null      ,"AAPL.L"  ,5L        ,99.0      ,101.5     ,false     ,null      ,"GBPUSD"  ,-0.1234   ,Double.NaN,Double.NaN),
        ("LDN-0001",100L      ,"VOD.L"   ,2L        ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1.0101010101010102,1.0101010101010102),
        ("LDN-0002",500L      ,"BT.L"    ,1L        ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,5.05050505050505,2407      ),
        ("LDN-0003",null      ,"VOD.L"   ,3L        ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,Double.NaN,Double.NaN),
        ("LDN-0008",5000L     ,"BT.L"    ,5L        ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,50.505050505050505,50.0      ),
        ("NYC-0002",50000L    ,"VOD.L"   ,6L        ,99.0      ,102.0     ,false     ,null      ,"GBPUSD"  ,1.1234    ,505.050505050505,50.0      ),
        ("NYC-0010",null      ,"VOD.L"   ,6L        ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,Double.NaN,Double.NaN),
        ("NYC-0011",null      ,"VOD/L"   ,6L        ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,Double.NaN,Double.NaN),
        ("NYC-0012",null      ,"VOD\\L"   ,6L        ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,Double.NaN,Double.NaN),
        ("NYC-0013",100000L   ,"VOD\\L"   ,6L        ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,1010.10101010101,50.0      )
      )
    }

    }

    Scenario("Check if and min") {

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("ifOrExample", "String", "=if(and(starts(orderId, \"NYC\"), min(120, ask) = 102.0), \"yay\", \"boo\")")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "ifOrExample"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, "boo"),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "boo"),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "boo"),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "boo"),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "boo"),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, "yay"),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "boo"),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "boo"),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "boo"),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "boo")
        )
      }
    }
    Scenario("Check or and min") {

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("orExample", "Boolean", "=or(starts(orderId, \"NYC\"), min(120, ask) = 101.5)")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "orExample"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, true),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, true),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, false),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, false),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, false),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, true),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, true),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, true),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, true),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, true)
        )
      }
    }

    Scenario("Check or and str equals") {

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("orExample", "Boolean", "=or(trader=\"chris\", ric=\"VOD.L\")")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "orExample"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, true),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, true),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, false),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, true),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, true),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, true),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, true),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, false),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, false),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, false)
        )
      }
    }

    Scenario("Check if and starts ") {

      //if logic with embedded func
      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("location", "String", "=if(starts(orderId, \"NYC\"), \"NewYork\", \"London\")")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "location"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, "NewYork"),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "London"),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "London"),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "London"),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "London"),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, "NewYork"),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "NewYork"),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "NewYork"),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "NewYork"),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "NewYork")
        )
      }
    }

    Scenario("Check basic if") {

      //if logic
      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("trueFalse", "Boolean", "=if(trader = \"chris\", true, false)")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "quantity", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "trueFalse"),
          ("NYC-0004", null, "AAPL.L", 5L, null, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, true),
          ("LDN-0001", 100L, "VOD.L", 2L, 100L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, true),
          ("LDN-0002", 100L, "BT.L", 1L, 100L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, false),
          ("LDN-0003", null, "VOD.L", 3L, null, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, true),
          ("LDN-0008", 100L, "BT.L", 5L, 100L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, true),
          ("NYC-0002", 100L, "VOD.L", 6L, 100L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, false),
          ("NYC-0010", null, "VOD.L", 6L, null, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, false),
          ("NYC-0011", null, "VOD/L", 6L, null, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, false),
          ("NYC-0012", null, "VOD\\L", 6L, null, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, false),
          ("NYC-0013", null, "VOD\\L", 6L, null, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, false)
        )
      }
    }

  }

}
