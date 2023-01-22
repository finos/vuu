package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.column.CalculatedColumnFixture.parseToColumn
import org.finos.vuu.core.table.{CalculatedColumn, Column, Columns, DataType, RowWithData}
import org.finos.vuu.grammer.{CalculatedColumnLexer, CalculatedColumnParser}
import org.finos.vuu.util.table.TableAsserts.genericLogic
import org.finos.vuu.viewport.{ViewPortColumns, ViewPortUpdate}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.{TableFor11, TableFor12, TableFor13}
import org.scalatest.prop.Tables.Table
import CalculatedColumnFixture._

class CalculatedColumnParseTest extends AnyFeatureSpec with Matchers with StrictLogging {


  /*
  we will use the LibreOffice definitions for functions: https://help.libreoffice.org/7.1/en-US/text/scalc/01/04060110.html?&DbPAR=CALC&System=UNIX

    math:
      abs
      min(x, y, z...)
      max(x,y,z....)
      sum(x, y, ...z)
      round(x, dps)
      rounddown(x, sigfig)
      roundup(x, sigfig)
      log10(number)
      log(number, logBase)
      ln(number)
      sqrt(number)
      sign(number)
      cos(number)
      int(number)
    string:
      len(x)
      upper(x)
      lower(x)
      replace(x, y, count)
      replaceAll(x, y)
      left(x, y)
      right(x, y)
      search()
      concatenate(x,y, ...z)
    logic:
      =if( condition, then, else )
      =or( x, y )
      =and(cond1, cond2, cond...)
   */


  def CalcColumn(name: String, dataType: String, calcDef: String): String = {
    name + ":" + dataType + ":" + calcDef
  }

  Feature("check calc column grammar") {

    Scenario("run samples of grammar, and check parse or fail") {

      val samples = List(
        "=or(starts(orderId, \"NYC\"), min(120, quantity) > 122)",
        "=if(price > 100, \"true\", \"false\")",
        "=bid",
        "=200",
        "=bid+(price*quantity)",
        "=(price*quantity)*bid",
        "=price*quantity*bid",
        "=(i1-i2)-i3",
        "=(bid*ask)+(price-quantity)",
        "=(bid*100)+(price-50)",
        "=bid*100+price-50",
        "=bid*100.00+price-50.0*bid/price",
        "=price*quantity",
        "=(bid + ask) / 2",
        "=min(min(i1, i3), i2)",
        "=min(i1, i2)",
        "=text(i1, i2)",
        "=max(100, 200, 300)",
        "=concatenate(max(i1, i2), text(quantity))",
      )

      samples.foreach(parse)

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

      withCalculatedColumns(sampleRowsLotsOfNulls(), tableColumns,
        CalcColumn("dodgyNumColumn", "String", "=100 * foo")
      ) {
        Table(
          ("orderId" ,"quantity","ric"     ,"tradeTime","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","dodgyNumColumn"),
          ("NYC-0004",null      ,"AAPL.L"  ,5L        ,99.0      ,101.5     ,false     ,null      ,"GBPUSD"  ,-0.1234   ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("LDN-0001",100L      ,"VOD.L"   ,2L        ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("LDN-0002",100L      ,"BT.L"    ,1L        ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("LDN-0003",null      ,"VOD.L"   ,3L        ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("LDN-0008",100L      ,"BT.L"    ,5L        ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("NYC-0002",100L      ,"VOD.L"   ,6L        ,99.0      ,102.0     ,false     ,null      ,"GBPUSD"  ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("NYC-0010",null      ,"VOD.L"   ,6L        ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("NYC-0011",null      ,"VOD/L"   ,6L        ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("NYC-0012",null      ,"VOD\\L"   ,6L        ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  "),
          ("NYC-0013",null      ,"VOD\\L"   ,6L        ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,"Error:Can't multiply string by numeric:100,Error:Column not found:foo  ")
        )
      }
    }

      Scenario("Check calculation scenarios") {

        import CalculatedColumnFixture.sampleRows
        import CalculatedColumnFixture.sampleRowsLotsOfNulls

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

        //null handling
        withCalculatedColumns(sampleRows(), tableColumns,
          CalcColumn("nullCheck", "String", "=quantity * bid")
        ) {
          Table(
            ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "nullCheck"),
            ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, Double.NaN),
            ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 9900.0),
            ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 9900.0),
            ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, Double.NaN),
            ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 9900.0),
            ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 9900.0),
            ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, Double.NaN),
            ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, Double.NaN),
            ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, Double.NaN),
            ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, Double.NaN)
          )
        }

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

        withCalculatedColumns(sampleRows(), tableColumns,
          CalcColumn("ifOrExample", "String", "=if(or(starts(orderId, \"NYC\"), min(120, ask) = 101.5), \"yay\", \"boo\")")
        ) {
          Table(
            ("orderId", "quantity", "ric", "tradeTime", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "ifOrExample"),
            ("NYC-0004", null, "AAPL.L", 5L, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, "yay"),
            ("LDN-0001", 100L, "VOD.L", 2L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "yay"),
            ("LDN-0002", 100L, "BT.L", 1L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "boo"),
            ("LDN-0003", null, "VOD.L", 3L, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "boo"),
            ("LDN-0008", 100L, "BT.L", 5L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "boo"),
            ("NYC-0002", 100L, "VOD.L", 6L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, "yay"),
            ("NYC-0010", null, "VOD.L", 6L, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "yay"),
            ("NYC-0011", null, "VOD/L", 6L, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "yay"),
            ("NYC-0012", null, "VOD\\L", 6L, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "yay"),
            ("NYC-0013", null, "VOD\\L", 6L, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "yay")
          )
        }

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

        withCalculatedColumns(sampleRows(), tableColumns,
          CalcColumn("halfTradeTime", "Long", "=tradeTime / 2")) {
          Table(
            ("orderId", "quantity", "ric", "tradeTime", "quantity", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "halfTradeTime"),
            ("NYC-0004", null, "AAPL.L", 5L, null, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, 2L),
            ("LDN-0001", 100L, "VOD.L", 2L, 100L, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 1L),
            ("LDN-0002", 100L, "BT.L", 1L, 100L, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 0L),
            ("LDN-0003", null, "VOD.L", 3L, null, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, 1L),
            ("LDN-0008", 100L, "BT.L", 5L, 100L, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 2L),
            ("NYC-0002", 100L, "VOD.L", 6L, 100L, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 3L),
            ("NYC-0010", null, "VOD.L", 6L, null, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, 3L),
            ("NYC-0011", null, "VOD/L", 6L, null, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, 3L),
            ("NYC-0012", null, "VOD\\L", 6L, null, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, 3L),
            ("NYC-0013", null, "VOD\\L", 6L, null, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, 3L)
          )
        }

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
    }


}
