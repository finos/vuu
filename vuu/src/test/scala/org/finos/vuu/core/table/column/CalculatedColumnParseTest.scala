package org.finos.vuu.core.table.column

import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.{CalculatedColumn, Column, Columns, DataType, RowWithData}
import org.finos.vuu.grammer.{CalculatedColumnLexer, CalculatedColumnParser}
import org.finos.vuu.util.table.TableAsserts.genericLogic
import org.finos.vuu.viewport.{ViewPortColumns, ViewPortUpdate}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.{TableFor12, TableFor13}
import org.scalatest.prop.Tables.Table

class CalculatedColumnParseTest extends AnyFeatureSpec with Matchers {

  val tableColumns: List[Column] = Columns.fromNames(
    "orderId".string(), "quantity".long(),
    "ric".string(), "tradeTime".long(), "onMkt".boolean(),
    "bid".double(), "ask".double(),
    //"negpos".double(),
    //"i1".int(), "i2".int(), "i3".int(),
    "trader".string(), "ccyCross".string(),
    "vwapPerf".double()
  ).toList


  def parse(s: String): Unit = {

    val input = CharStreams.fromString(s)
    val lexer = new CalculatedColumnLexer(input)
    val tokens = new CommonTokenStream(lexer)
    val parser = new CalculatedColumnParser(tokens)

    val tree = parser.expression() // begin parsing at init rule

    System.out.println("IN:" + s)
    System.out.println("OUT" + tree.toStringTree(parser)) // print LISP-style tree

    //    val tableDef = TableDef(
    //        "CalColTest",
    //         "id",

    //)

    //    val eval = new CalculatedColumnVisitor(columns)
    //
    //    val result = eval.visit(tree)
    //
    //    System.out.println(result) // print LISP-style tree
    //
    //    val row = RowWithData("foo", Map("price" -> 12.23D, "quantity" -> 200L, "id" -> "foo", "i1" -> 100, "i2" -> 10, "i3" -> 1, "bid" -> 99.00D, "ask" -> 101.01D))
    //
    //    println(result.calculate(row))
  }

  def parseToColumn(columns: ViewPortColumns, calcDef: String): Column = {
    val (name :: dataType :: calcdsl :: _) = calcDef.split(":").toList
    val dt = DataType.fromString(dataType)
    val input = CharStreams.fromString(calcdsl)
    val lexer = new CalculatedColumnLexer(input)
    val tokens = new CommonTokenStream(lexer)
    val parser = new CalculatedColumnParser(tokens)
    val tree = parser.expression()
    val eval = new CalculatedColumnVisitor(columns)
    val clause = eval.visit(tree)
    val column = CalculatedColumn(name, clause, columns.count(), dt)
    columns.addColumn(column)
    column
  }

  def generic12Assert(rows: List[RowWithData], columns: ViewPortColumns, expectation: TableFor12[_, _, _, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = rows.map(row => {
      columns.getColumns().map(c => c.name -> c.getData(row)).toMap
    }).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map(row => heading.productIterator.zip(row.productIterator).map({ case (head, data) => (head -> data) }).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic13Assert(rows: List[RowWithData], columns: ViewPortColumns, expectation: TableFor13[_, _, _, _, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = rows.map(row => {
      columns.getColumns().map(c => c.name -> c.getData(row)).toMap
    }).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map(row => heading.productIterator.zip(row.productIterator).map({ case (head, data) => (head -> data) }).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def withCalculatedColumns(rows: List[RowWithData], columns: List[Column], calcs: String*)(expectedFn: => Any): Unit = {

    val vpColumns = new ViewPortColumns(columns)

    calcs.foreach(parseToColumn(vpColumns, _))

    val expected = expectedFn match {
      case table: TableFor12[_, _, _, _, _, _, _, _, _, _, _, _] => generic12Assert(rows, vpColumns, table)
      case table: TableFor13[_, _, _, _, _, _, _, _, _, _, _, _, _] => generic13Assert(rows, vpColumns, table)
    }

  }


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

    Scenario("Do calculation scenarios") {

      import CalculatedColumnFixture.sampleRows

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("orExample", "Boolean", "=or(trader=\"chris\")")
      ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "quantity", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "orExample")
        )
      }

      //if logic
      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("location", "String", "=if(starts(orderId, \"NYC\"), \"NewYork\", \"London\")")
      ) {
        Table(
          ("orderId" ,"quantity","ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","location"),
          ("NYC-0004",null      ,"AAPL.L"  ,5L        ,null      ,99.0      ,101.5     ,false     ,"chris"   ,"GBPUSD"  ,-0.1234   ,"NewYork" ),
          ("LDN-0001",100.0     ,"VOD.L"   ,2L        ,100.0     ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"London"  ),
          ("LDN-0002",100.0     ,"BT.L"    ,1L        ,100.0     ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"London"  ),
          ("LDN-0003",null      ,"VOD.L"   ,3L        ,null      ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"London"  ),
          ("LDN-0008",100.0     ,"BT.L"    ,5L        ,100.0     ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"London"  ),
          ("NYC-0002",100.0     ,"VOD.L"   ,6L        ,100.0     ,99.0      ,102.0     ,false     ,"steve"   ,"GBPUSD"  ,1.1234    ,"NewYork" ),
          ("NYC-0010",null      ,"VOD.L"   ,6L        ,null      ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"NewYork" ),
          ("NYC-0011",null      ,"VOD/L"   ,6L        ,null      ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"NewYork" ),
          ("NYC-0012",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"NewYork" ),
          ("NYC-0013",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,"NewYork" )
        )
      }

      //if logic
      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("trueFalse", "Boolean", "=if(trader = \"chris\", true, false)")
      ) {
        Table(
          ("orderId" ,"quantity","ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","trueFalse"),
          ("NYC-0004",null      ,"AAPL.L"  ,5L        ,null      ,99.0      ,101.5     ,false     ,"chris"   ,"GBPUSD"  ,-0.1234   ,true      ),
          ("LDN-0001",100.0     ,"VOD.L"   ,2L        ,100.0     ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,true      ),
          ("LDN-0002",100.0     ,"BT.L"    ,1L        ,100.0     ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,false     ),
          ("LDN-0003",null      ,"VOD.L"   ,3L        ,null      ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,true      ),
          ("LDN-0008",100.0     ,"BT.L"    ,5L        ,100.0     ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,true      ),
          ("NYC-0002",100.0     ,"VOD.L"   ,6L        ,100.0     ,99.0      ,102.0     ,false     ,"steve"   ,"GBPUSD"  ,1.1234    ,false     ),
          ("NYC-0010",null      ,"VOD.L"   ,6L        ,null      ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,false     ),
          ("NYC-0011",null      ,"VOD/L"   ,6L        ,null      ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,false     ),
          ("NYC-0012",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,false     ),
          ("NYC-0013",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,false     )
        )
      }

      println("here")

      withCalculatedColumns(sampleRows(), tableColumns, CalcColumn("mid", "Long", "=(bid + ask) / 2") ) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "quantity", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "mid"),
          ("NYC-0004", null, "AAPL.L", 5L, null, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, 100.25),
          ("LDN-0001", 100.0, "VOD.L", 2L, 100.0, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, 100.25),
          ("LDN-0002", 100.0, "BT.L", 1L, 100.0, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, 100.005),
          ("LDN-0003", null, "VOD.L", 3L, null, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, 100.15),
          ("LDN-0008", 100.0, "BT.L", 5L, 100.0, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, 102.5),
          ("NYC-0002", 100.0, "VOD.L", 6L, 100.0, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, 100.5),
          ("NYC-0010", null, "VOD.L", 6L, null, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, 104.5),
          ("NYC-0011", null, "VOD/L", 6L, null, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, 104.0),
          ("NYC-0012", null, "VOD\\L", 6L, null, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, 102.055),
          ("NYC-0013", null, "VOD\\L", 6L, null, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, 110.5)
        )
      }

      withCalculatedColumns(sampleRows(), tableColumns, CalcColumn("traderCcy", "String", "=concatenate(trader, ccyCross)")) {
        Table(
          ("orderId", "quantity", "ric", "tradeTime", "quantity", "bid", "ask", "onMkt", "trader", "ccyCross", "vwapPerf", "traderCcy"),
          ("NYC-0004", null, "AAPL.L", 5L, null, 99.0, 101.5, false, "chris", "GBPUSD", -0.1234, "chrisGBPUSD"),
          ("LDN-0001", 100.0, "VOD.L", 2L, 100.0, 99.0, 101.5, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD"),
          ("LDN-0002", 100.0, "BT.L", 1L, 100.0, 99.0, 101.01, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("LDN-0003", null, "VOD.L", 3L, null, 99.0, 101.3, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD"),
          ("LDN-0008", 100.0, "BT.L", 5L, 100.0, 99.0, 106.0, true, "chris", "GBPUSD", 1.1234, "chrisGBPUSD"),
          ("NYC-0002", 100.0, "VOD.L", 6L, 100.0, 99.0, 102.0, false, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("NYC-0010", null, "VOD.L", 6L, null, 99.0, 110.0, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("NYC-0011", null, "VOD/L", 6L, null, 99.0, 109.0, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("NYC-0012", null, "VOD\\L", 6L, null, 99.0, 105.11, true, "steve", "GBPUSD", 1.1234, "steveGBPUSD"),
          ("NYC-0013", null, "VOD\\L", 6L, null, 99.0, 122.0, true, "rahúl", "$GBPUSD", 1.1234, "rahúl$GBPUSD")
        )
      }

      //at the moment, if you are doing calculations of calculations they have to be in sequence, it doesn't work out the dependency graph
      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("traderCcy", "String", "=concatenate(trader, ccyCross)"),
        CalcColumn("traderCcyRic", "String", "=concatenate(traderCcy, ric)")) {
        Table(
          ("orderId" ,"quantity","ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","traderCcy","traderCcyRic"),
          ("NYC-0004",null      ,"AAPL.L"  ,5L        ,null      ,99.0      ,101.5     ,false     ,"chris"   ,"GBPUSD"  ,-0.1234   ,"chrisGBPUSD","chrisGBPUSDAAPL.L"),
          ("LDN-0001",100.0     ,"VOD.L"   ,2L        ,100.0     ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"chrisGBPUSD","chrisGBPUSDVOD.L"),
          ("LDN-0002",100.0     ,"BT.L"    ,1L        ,100.0     ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"steveGBPUSD","steveGBPUSDBT.L"),
          ("LDN-0003",null      ,"VOD.L"   ,3L        ,null      ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"chrisGBPUSD","chrisGBPUSDVOD.L"),
          ("LDN-0008",100.0     ,"BT.L"    ,5L        ,100.0     ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,"chrisGBPUSD","chrisGBPUSDBT.L"),
          ("NYC-0002",100.0     ,"VOD.L"   ,6L        ,100.0     ,99.0      ,102.0     ,false     ,"steve"   ,"GBPUSD"  ,1.1234    ,"steveGBPUSD","steveGBPUSDVOD.L"),
          ("NYC-0010",null      ,"VOD.L"   ,6L        ,null      ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"steveGBPUSD","steveGBPUSDVOD.L"),
          ("NYC-0011",null      ,"VOD/L"   ,6L        ,null      ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"steveGBPUSD","steveGBPUSDVOD/L"),
          ("NYC-0012",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,"steveGBPUSD","steveGBPUSDVOD\\L"),
          ("NYC-0013",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,"rahúl$GBPUSD","rahúl$GBPUSDVOD\\L")
        )
      }

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("halfTradeTime", "String", "=tradeTime / 2")) {
        Table(
          ("orderId" ,"quantity","ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","halfTradeTime"),
          ("NYC-0004",null      ,"AAPL.L"  ,5L        ,null      ,99.0      ,101.5     ,false     ,"chris"   ,"GBPUSD"  ,-0.1234   ,2L        ),
          ("LDN-0001",100.0     ,"VOD.L"   ,2L        ,100.0     ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1L        ),
          ("LDN-0002",100.0     ,"BT.L"    ,1L        ,100.0     ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,0L        ),
          ("LDN-0003",null      ,"VOD.L"   ,3L        ,null      ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1L        ),
          ("LDN-0008",100.0     ,"BT.L"    ,5L        ,100.0     ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,2L        ),
          ("NYC-0002",100.0     ,"VOD.L"   ,6L        ,100.0     ,99.0      ,102.0     ,false     ,"steve"   ,"GBPUSD"  ,1.1234    ,3L        ),
          ("NYC-0010",null      ,"VOD.L"   ,6L        ,null      ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,3L        ),
          ("NYC-0011",null      ,"VOD/L"   ,6L        ,null      ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,3L        ),
          ("NYC-0012",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,3L        ),
          ("NYC-0013",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,3L        )
        )
      }

      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("absVwap", "Double", "=abs(vwapPerf)")) {
        Table(
          ("orderId" ,"quantity","ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","absVwap" ),
          ("NYC-0004",null      ,"AAPL.L"  ,5L        ,null      ,99.0      ,101.5     ,false     ,"chris"   ,"GBPUSD"  ,-0.1234   ,0.1234    ),
          ("LDN-0001",100.0     ,"VOD.L"   ,2L        ,100.0     ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1.1234    ),
          ("LDN-0002",100.0     ,"BT.L"    ,1L        ,100.0     ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ),
          ("LDN-0003",null      ,"VOD.L"   ,3L        ,null      ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1.1234    ),
          ("LDN-0008",100.0     ,"BT.L"    ,5L        ,100.0     ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1.1234    ),
          ("NYC-0002",100.0     ,"VOD.L"   ,6L        ,100.0     ,99.0      ,102.0     ,false     ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ),
          ("NYC-0010",null      ,"VOD.L"   ,6L        ,null      ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ),
          ("NYC-0011",null      ,"VOD/L"   ,6L        ,null      ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ),
          ("NYC-0012",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ),
          ("NYC-0013",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,1.1234    )
        )
      }

      //show calcs of calcs
      withCalculatedColumns(sampleRows(), tableColumns,
        CalcColumn("absVwap", "Double", "=abs(vwapPerf)"),
        CalcColumn("absConcat", "Double", "=concatenate(absVwap, ric)")
        ) {
        Table(
          ("orderId" ,"quantity","ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"onMkt"   ,"trader"  ,"ccyCross","vwapPerf","absVwap" ,"absConcat"),
          ("NYC-0004",null      ,"AAPL.L"  ,5L        ,null      ,99.0      ,101.5     ,false     ,"chris"   ,"GBPUSD"  ,-0.1234   ,0.1234    ,"0.1234AAPL.L"),
          ("LDN-0001",100.0     ,"VOD.L"   ,2L        ,100.0     ,99.0      ,101.5     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1.1234    ,"1.1234VOD.L"),
          ("LDN-0002",100.0     ,"BT.L"    ,1L        ,100.0     ,99.0      ,101.01    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ,"1.1234BT.L"),
          ("LDN-0003",null      ,"VOD.L"   ,3L        ,null      ,99.0      ,101.3     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1.1234    ,"1.1234VOD.L"),
          ("LDN-0008",100.0     ,"BT.L"    ,5L        ,100.0     ,99.0      ,106.0     ,true      ,"chris"   ,"GBPUSD"  ,1.1234    ,1.1234    ,"1.1234BT.L"),
          ("NYC-0002",100.0     ,"VOD.L"   ,6L        ,100.0     ,99.0      ,102.0     ,false     ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ,"1.1234VOD.L"),
          ("NYC-0010",null      ,"VOD.L"   ,6L        ,null      ,99.0      ,110.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ,"1.1234VOD.L"),
          ("NYC-0011",null      ,"VOD/L"   ,6L        ,null      ,99.0      ,109.0     ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ,"1.1234VOD/L"),
          ("NYC-0012",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,105.11    ,true      ,"steve"   ,"GBPUSD"  ,1.1234    ,1.1234    ,"1.1234VOD\\L"),
          ("NYC-0013",null      ,"VOD\\L"   ,6L        ,null      ,99.0      ,122.0     ,true      ,"rahúl"   ,"$GBPUSD" ,1.1234    ,1.1234    ,"1.1234VOD\\L")
        )
      }





    }
  }

}
