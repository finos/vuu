package org.finos.vuu.core.sort

import org.finos.toolbox.collection.MapDiffResult
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.text.{AsciiUtil, CodeGenUtil}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.core.filter.FilterClause
import org.finos.vuu.core.filter.`type`.AntlrBasedFilter
import org.finos.vuu.core.table.{Columns, InMemDataTable, RowWithData, TablePrimaryKeys, ViewPortColumnCreator}
import org.finos.vuu.test.TestFriendlyJoinTableProvider
import org.scalatest.Assertions.fail

object FilterAndSortFixture {
  private val timeProvider = new TestFriendlyClock(10001L)

  def getFilteredRows(table: InMemDataTable, clause: FilterClause): Iterable[RowWithData] = {
    val vpColumns = ViewPortColumnCreator.create(table)
    val filter = AntlrBasedFilter(clause)
    val resultKeys = filter.doFilter(table, table.primaryKeys, vpColumns, true)
    val resultRows = resultKeys.map(key => table.pullRow(key, vpColumns).asInstanceOf[RowWithData])
    resultRows
  }

  def assertRows(result: Set[RowWithData], expectedKeys: Set[String]): Unit = {
    if (result.map(f => f.key) != expectedKeys) {
      fail(s"""ROW DIFFERENCES FOUND:
           |${expectedKeys}
           |
           |ACTUAL FILTERED ROWS:
           |${formatRows(result)}""".stripMargin
      )
    }
  }

  def formatDiff(diff: MapDiffResult): String = {
    val diffHeaders = Array("exp key", "exp val", "exp datatype", "act key", "act val", "act datatype")

    val expectedNotSeen = diff.leftNotRight.map(kpv => Array[Any]("", "", "", kpv.path, kpv.value, kpv.theType)).toArray
    val seenUnexpected = diff.rightNotLeft.map(kpv => Array[Any](kpv.path, kpv.value, kpv.theType, "", "", "")).toArray
    val different = diff.bothButDiff.map(tuple => {
      val (left, right) = tuple
      Array[Any](left.path, left.value, left.theType, right.path, right.value, right.theType)
    }).toArray[Array[Any]]

    AsciiUtil.asAsciiTable(diffHeaders, expectedNotSeen ++ seenUnexpected ++ different)
  }

  def formatRows(rows: Set[RowWithData]): String = {
    val rowLines = rows.map(row => s"RowWithData(\"${row.key}\", ${CodeGenUtil.mapToString(row.data)})")
    s"""Set(
       |${rowLines.mkString(",\n")}
       |)
       |""".stripMargin
  }

  def doSort(table: InMemDataTable, sort: Sort): List[(String, RowWithData)] = {
    doSort(table, sort, table.primaryKeys)
  }

  def doSort(table: InMemDataTable, sort: Sort, tablePrimaryKeys: TablePrimaryKeys): List[(String, RowWithData)] = {
    val viewPortColumns = ViewPortColumnCreator.create(table, table.columns().map(_.name).toList)
    val result = sort.doSort(table, tablePrimaryKeys, viewPortColumns)
    val asTable = result.toArray.map(key => (key, table.pullRow(key, viewPortColumns).asInstanceOf[RowWithData])).toList
    asTable
  }

  def setupTable(): InMemDataTable = {
    setupTable(List.empty,
      row("tradeTime" -> 5L, "quantity" -> 500, "price" -> 283.10, "side" -> 'B', "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 2L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 1L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 3L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 5L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> 100, "price" -> 94.12, "side" -> 'B', "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD")
    )(using timeProvider)
  }

  def setupTable2(): InMemDataTable = {
    setupTable(indices = List("orderId", "ric", "tradeTime", "onMkt", "price", "side", "quantity"), rows =
      row("tradeTime" -> 5L, "quantity" -> null, "price" -> 283.10, "side" -> 'B', "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 2L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 1L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 3L, "quantity" -> null, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 5L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> null, "price" -> 94.12, "side" -> 'B', "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> 105, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> null, "price" -> 94.12, "side" -> 'B', "ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      //unicode in trade name and special char in ccycross
      row("tradeTime" -> 6L, "quantity" -> null, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD")
    )(using timeProvider)
  }

  def setupTableWithCreationTime(): InMemDataTable = {
    val clock = new TestFriendlyClock(1000L)
    setupTableWithCreationTime(List())(using clock)
  }

  def setupTableWithCreationTime(indices: List[String])(using clock: TestFriendlyClock): InMemDataTable = {
    val now: Long = clock.now();
    val table: InMemDataTable = setupTable(indices,
      row("tradeTime" -> 5L, "quantity" -> 500, "price" -> 283.10, "side" -> 'B', "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 3L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
    )(using clock)
    clock.advanceBy(1000L)
    table.processUpdate("LDN-0001", row("tradeTime" -> 2L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"))
    table.processUpdate("LDN-0008", row("tradeTime" -> 5L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"))
    table
  }

  def setupTable(indices: List[String], rows: RowWithData*)(using clock: Clock): InMemDataTable = {
    val columns = Columns.fromNames(
      "orderId:String",
      "trader:String",
      "ric:String",
      "tradeTime:Long",
      "quantity:Int",
      "ccyCross:String",
      "onMkt:Boolean",
      "price:Double",
      "side:Char"
    )
    val tableDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = columns,
      indices = Indices(indices.map(f => Index(f)) *),
      joinFields = "ric", "orderId", "ccyCross",
    )
    val table: InMemDataTable = new InMemDataTable(tableDef, new TestFriendlyJoinTableProvider)(new MetricsProviderImpl, clock)
    rows.foreach(row => table.processUpdate(row.key, row))
    table
  }

  def row(data: (String, Any)*): RowWithData = {
    val map = Map.newBuilder[String, Any].addAll(data).result()
    RowWithData(map("orderId").toString, map)
  }
}
