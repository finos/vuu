package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.antlr.v4.runtime.{CharStreams, CommonTokenStream}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table._
import org.finos.vuu.grammar.{CalculatedColumnLexer, CalculatedColumnParser}
import org.finos.vuu.util.table.TableAsserts.genericLogic
import org.finos.vuu.viewport.ViewPortColumns
import org.scalatest.prop.{TableFor11, TableFor12, TableFor13}

import scala.collection.mutable.ListBuffer

object CalculatedColumnFixture extends StrictLogging {

  def CalcColumn(name: String, dataType: String, calcDef: String): String = {
    name + ":" + dataType + ":" + calcDef
  }

  def parse(s: String): Unit = {

    val input = CharStreams.fromString(s)
    val lexer = new CalculatedColumnLexer(input)
    val tokens = new CommonTokenStream(lexer)
    val parser = new CalculatedColumnParser(tokens)

    val tree = parser.expression() // begin parsing at init rule

    logger.debug("IN:" + s)
    logger.debug("OUT" + tree.toStringTree(parser)) // print LISP-style tree
  }

  def parseColumn(columns: Iterable[Column], calcDef: String): Column = {
    val name :: dataType :: calcdsl :: _ = calcDef.split(":").toList
    val dt = DataType.fromString(dataType)
    val input = CharStreams.fromString(calcdsl)
    val lexer = new CalculatedColumnLexer(input)
    val tokens = new CommonTokenStream(lexer)
    val parser = new CalculatedColumnParser(tokens)
    val tree = parser.expression()
    logger.debug("Parse IN:" + calcDef)
    logger.debug("Parse OUT" + tree.toStringTree(parser))
    val eval = new CalculatedColumnVisitor(columns)
    val clause = eval.visit(tree)
    CalculatedColumn(name, clause, columns.size, dt)
  }

  val tableColumns: List[Column] = Columns.fromNames(
    "orderId".string(), "quantity".long(),
    "ric".string(), "tradeTime".long(), "onMkt".boolean(),
    "bid".double(), "ask".double(),
    //"negpos".double(),
    //"i1".int(), "i2".int(), "i3".int(),
    "trader".string(), "ccyCross".string(),
    "vwapPerf".double()
  ).toList

  def sampleRows(): List[RowWithData] = {
    val rows = List(
      RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> null, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.50, "vwapPerf" -> -0.1234)),
      RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100L, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.50, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 100L, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.01, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.30, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 100L, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 106.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 100L, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 102.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 110.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0011", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 109.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0012", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 105.11, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0013", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "bid" -> 99.00, "ask" -> 122.00, "vwapPerf" -> 1.1234))
    )
    rows
  }

  def sampleRowsLotsOfNulls(): List[RowWithData] = {
    val rows = List(
      RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> null, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> null, "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.50, "vwapPerf" -> -0.1234)),
      RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100L, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.50, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 100L, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.01, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.30, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 100L, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 106.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 100L, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> null, "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 102.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 110.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0011", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 109.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0012", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 105.11, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0013", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "bid" -> 99.00, "ask" -> 122.00, "vwapPerf" -> 1.1234))
    )
    rows
  }

  def sampleRowsLotsOfNullsMaths(): List[RowWithData] = {
    val rows = List(
      RowWithData("NYC-0004", Map("tradeTime" -> 5L, "quantity" -> null, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> null, "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.50, "vwapPerf" -> -0.1234)),
      RowWithData("LDN-0001", Map("tradeTime" -> 2L, "quantity" -> 100L, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.50, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0002", Map("tradeTime" -> 1L, "quantity" -> 500L, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.01, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0003", Map("tradeTime" -> 3L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 101.30, "vwapPerf" -> 1.1234)),
      RowWithData("LDN-0008", Map("tradeTime" -> 5L, "quantity" -> 5000L, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 106.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0002", Map("tradeTime" -> 6L, "quantity" -> 50_000L, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> null, "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 102.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0010", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 110.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0011", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 109.00, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0012", Map("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "bid" -> 99.00, "ask" -> 105.11, "vwapPerf" -> 1.1234)),
      RowWithData("NYC-0013", Map("tradeTime" -> 6L, "quantity" -> 100_000L, "ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "bid" -> 99.00, "ask" -> 122.00, "vwapPerf" -> 1.1234))
    )
    rows
  }

  def generic12Assert(rows: List[RowWithData], columns: ViewPortColumns, expectation: TableFor12[_, _, _, _, _, _, _, _, _, _, _, _]): Unit = {

    val arraysOfMaps = rows.map(rowToMap(_, columns)).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map(row => heading.productIterator.zip(row.productIterator).map({ case (head, data) => head -> data }).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic11Assert(rows: List[RowWithData], columns: ViewPortColumns, expectation: TableFor11[_, _, _, _, _, _, _, _, _, _, _]): Unit = {

    val arraysOfMaps = rows.map(rowToMap(_, columns)).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map(row => heading.productIterator.zip(row.productIterator).map({ case (head, data) => head -> data }).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic13Assert(rows: List[RowWithData], columns: ViewPortColumns, expectation: TableFor13[_, _, _, _, _, _, _, _, _, _, _, _, _]): Unit = {

    val arraysOfMaps = rows.map(rowToMap(_, columns)).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map(row => heading.productIterator.zip(row.productIterator).map({ case (head, data) => head -> data }).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  private def rowToMap(row: RowData, columns: ViewPortColumns) = columns.getColumns().map(c => c.name -> c.getData(row)).toMap

  def withCalculatedColumns(rows: List[RowWithData], columns: List[Column], calcs: String*)(expectedFn: => Any): Unit = {

    val columnBuffer: ListBuffer[Column] = ListBuffer()

    for (calc <- calcs) {
      columnBuffer.addOne(parseColumn(columnBuffer, calc))
    }

    val vpColumns = ViewPortColumns(columnBuffer.toList)

    expectedFn match {
      case table: TableFor11[_, _, _, _, _, _, _, _, _, _, _] => generic11Assert(rows, vpColumns, table)
      case table: TableFor12[_, _, _, _, _, _, _, _, _, _, _, _] => generic12Assert(rows, vpColumns, table)
      case table: TableFor13[_, _, _, _, _, _, _, _, _, _, _, _, _] => generic13Assert(rows, vpColumns, table)
    }

  }

}
