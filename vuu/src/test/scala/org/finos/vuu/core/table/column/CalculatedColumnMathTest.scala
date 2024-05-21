package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.column.CalculatedColumnFixture._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class CalculatedColumnMathTest extends AnyFeatureSpec with Matchers with StrictLogging {

  Feature("Check math based calc clolumns") {


    Scenario("Check additional functions1") {
      //check what happens when we submit garbage column names
      withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
        CalcColumn("qtyDivbid", "Double", "=quantity / bid "),
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "qtyDivbid"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, null),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 1.0101010101010102),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 1.0101010101010102),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, null),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 1.0101010101010102),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, 1.0101010101010102),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, null)
        )
      }
    }

    Scenario("Check bracketed Divide") {
      //check what happens when we submit garbage column names
      withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
        CalcColumn("qtyDivbid", "Double", "=(quantity / bid)"),
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "qtyDivbid"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, null),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 1.0101010101010102),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 1.0101010101010102),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, null),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 1.0101010101010102),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, 1.0101010101010102),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, null)
        )
      }
    }

    Scenario("Min Test 2") {
      //check what happens when we submit garbage column names
      withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
        CalcColumn("minTest", "Double", "=min(1, 2)"),
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "minTest"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, 1),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 1),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 1),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, 1),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 1),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, 1),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, 1),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, 1),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, 1),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, 1)
        )
      }
    }

    Scenario("Min Test") {
      //check what happens when we submit garbage column names
      withCalculatedColumns(sampleRowsLotsOfNullsMaths(), tableColumns,
        CalcColumn("refCol", "Double", "=quantity / bid"),
        CalcColumn("minTest", "Double", "=min(50, quantity / bid)"),
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "refCol", "minTest"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, null, null),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 1.0101010101010102, 1.0101010101010102),
          ("LDN-0002", 500L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 5.05050505050505, 5.05050505050505),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, null, null),
          ("LDN-0008", 5000L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 50.505050505050505, 50.0),
          ("NYC-0002", 50000L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, 505.050505050505, 50.0),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, null, null),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, null, null),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, null, null),
          ("NYC-0013", 100000L, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, 1010.10101010101, 50.0)
        )
      }
    }

    Scenario("Basic field math operation") {

      //null handling
      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("nullCheck", "String", "=quantity * bid")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "nullCheck"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, null),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 9900.0),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 9900.0),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, null),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 9900.0),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 9900.0),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, null)
        )
      }

    }

    Scenario("Check field div") {

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("halfTradeTime", "Double", "=tradeTime / 2")) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "quantity", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "halfTradeTime"),
          ("NYC-0004", null, "AAPL.L", 5L, null, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, 2.5),
          ("LDN-0001", 100L, "VOD.L", 2L, 100L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 1D),
          ("LDN-0002", 100L, "BT.L", 1L, 100L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 0.5),
          ("LDN-0003", null, "VOD.L", 3L, null, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, 1.5),
          ("LDN-0008", 100L, "BT.L", 5L, 100L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 2.5),
          ("NYC-0002", 100L, "VOD.L", 6L, 100L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 3D),
          ("NYC-0010", null, "VOD.L", 6L, null, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, 3D),
          ("NYC-0011", null, "VOD/L", 6L, null, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, 3D),
          ("NYC-0012", null, "VOD\\L", 6L, null, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, 3D),
          ("NYC-0013", null, "VOD\\L", 6L, null, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, 3D)
        )
      }
    }

    Scenario("Division should produce double result even when two non-double columns are divided") {

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("quantityExecutedPerTimeUnit", "Double", "=quantity / tradeTime")) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "quantity", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "quantityExecutedPerTimeUnit"),
          ("NYC-0004", null, "AAPL.L", 5L, null, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, null),
          ("LDN-0001", 100L, "VOD.L", 2L, 100L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 50D),
          ("LDN-0002", 100L, "BT.L", 1L, 100L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 100D),
          ("LDN-0003", null, "VOD.L", 3L, null, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, null),
          ("LDN-0008", 100L, "BT.L", 5L, 100L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 20D),
          ("NYC-0002", 100L, "VOD.L", 6L, 100L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 16.666666666666668),
          ("NYC-0010", null, "VOD.L", 6L, null, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0011", null, "VOD/L", 6L, null, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0012", null, "VOD\\L", 6L, null, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0013", null, "VOD\\L", 6L, null, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, null)
        )
      }
    }

    Scenario("Check math func") {

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("absVwap", "Double", "=abs(vwapPerf)")) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "absVwap"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, 0.1234),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 1.1234),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 1.1234),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, 1.1234),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 1.1234),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 1.1234),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, 1.1234),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, 1.1234),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, 1.1234),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, 1.1234)
        )
      }
    }

    Scenario("Check calc on calc") {

      //show calcs of calcs
      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("absVwap", "Double", "=abs(vwapPerf)"),
        CalcColumn("absConcat", "String", "=concatenate(absVwap, ric)")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "absVwap", "absConcat"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, 0.1234, "0.1234AAPL.L"),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 1.1234, "1.1234VOD.L"),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 1.1234, "1.1234BT.L"),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, 1.1234, "1.1234VOD.L"),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 1.1234, "1.1234BT.L"),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 1.1234, "1.1234VOD.L"),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, 1.1234, "1.1234VOD.L"),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, 1.1234, "1.1234VOD/L"),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, 1.1234, "1.1234VOD\\L"),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, 1.1234, "1.1234VOD\\L")
        )
      }
    }

    Scenario("Check basic math 2") {

      withCalculatedColumns(sampleRows(), tableColumns, CalcColumn("mid", "Long", "=(bid + ask) / 2")) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "mid"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, 100.25),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 100.25),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 100.005),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, 100.15),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 102.5),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 100.5),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, 104.5),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, 104.0),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, 102.055),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, 110.5)
        )
      }
    }

    Scenario("Check Basic Math 1") {

      withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
        CalcColumn("dodgyNumColumn", "String", "=100 * foo")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "dodgyNumColumn"),
          ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, null, "GBPUSD", -0.1234, null),
          ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, null),
          ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, null),
          ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, null),
          ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, null),
          ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, null, "GBPUSD", 1.1234, null),
          ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, null),
          ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, null)
        )
      }
    }
  }
}

