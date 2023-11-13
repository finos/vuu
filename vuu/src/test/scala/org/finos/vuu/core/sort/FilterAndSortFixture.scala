package org.finos.vuu.core.sort

import org.finos.toolbox.collection.{MapDiffResult, MapDiffUtils}
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.text.{AsciiUtil, CodeGenUtil}
import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.core.filter.FilterClause
import org.finos.vuu.core.table.{Columns, RowWithData, SimpleDataTable, ViewPortColumnCreator}
import org.finos.vuu.test.TestFriendlyJoinTableProvider

object FilterAndSortFixture {

  def getFilteredRows(table: SimpleDataTable, clause: FilterClause): Iterable[RowWithData] = {
    val vpColumns = ViewPortColumnCreator.create(table, table.columns().map(_.name).toList)
    val filter = AntlrBasedFilter(clause)
    val resultKeys = filter.dofilter(table, table.primaryKeys, vpColumns)
    val resultRows = resultKeys.map(key => table.pullRow(key, vpColumns).asInstanceOf[RowWithData])
    resultRows
  }

  def expectRows(result: List[(String,RowWithData)])(expectedFn: => List[RowWithData]): Unit =
    assertRows(result.map(_._2).toSet, expectedFn.toSet)

  def assertRows(result: Set[RowWithData], expected:  Set[RowWithData]): Unit ={
    val diff = MapDiffUtils.diff(
      Map("rows" -> result.map(_.data)),
      Map("rows" -> expected.map(_.data))
    )
    assert(!diff.hasDiff,
      s"""ROW DIFFERENCES FOUND:
         |${formatDiff(diff)}
         |
         |ACTUAL FILTERED ROWS:
         |${formatRows(result)}""".stripMargin
    )
  }

  def formatDiff(diff: MapDiffResult): String = {
    val diffHeaders = Array("exp key", "exp val", "exp datatype", "act key", "act val", "act datatype")

    val expectedNotSeen = diff.leftNotRight.map(kpv => Array[Any]("", "", "", kpv.path, kpv.value, kpv.theType)).toArray
    val seenUnexpected  = diff.rightNotLeft.map(kpv => Array[Any](kpv.path, kpv.value, kpv.theType, "", "", "")).toArray
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

  def doSort(table: SimpleDataTable, sort: Sort): List[(String, RowWithData)] = {
    val viewPortColumns = ViewPortColumnCreator.create(table, table.columns().map(_.name).toList)
    val result = sort.doSort(table, table.primaryKeys, viewPortColumns)
    val vpColumns = ViewPortColumnCreator.create(table, table.columns().map(_.name).toList)
    val asTable = result.toArray.map( key => (key, table.pullRow(key, vpColumns).asInstanceOf[RowWithData] ) ).toList
    asTable
  }

  def setupTable(): SimpleDataTable = {
    setupTable(List.empty,
      row("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD")
    )
  }

  def setupTable2(): SimpleDataTable = {
    setupTable(indices = List("orderId", "ric", "tradeTime", "onMkt"), rows =
      row("tradeTime" -> 5L, "quantity" -> null, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 3L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      //unicode in trade name and special char in ccycross
      row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD")
    )
  }

  def setupTable(indices: List[String], rows: RowWithData*): SimpleDataTable = {
    val columns = Columns.fromNames(
      "orderId:String",
      "trader:String",
      "ric:String",
      "tradeTime:Long",
      "quantity:Double",
      "ccyCross:String",
      "onMkt:Boolean"
    )
    val tableDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = columns,
      indices = Indices(indices.map(Index):_*),
      joinFields = "ric", "orderId", "ccyCross"
    )
    val table: SimpleDataTable = new SimpleDataTable(tableDef, new TestFriendlyJoinTableProvider)(new MetricsProviderImpl)
    rows.foreach(row => table.processUpdate(row.key, row, 0L))
    table
  }

  def row(data: (String, Any)*): RowWithData = {
    val map = Map.newBuilder[String, Any].addAll(data).result()
    RowWithData(map("orderId").toString, map)
  }
}
