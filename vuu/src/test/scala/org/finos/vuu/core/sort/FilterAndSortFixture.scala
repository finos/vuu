package org.finos.vuu.core.sort

import org.finos.toolbox.collection.{MapDiffResult, MapDiffUtils}
import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.text.{AsciiUtil, CodeGenUtil}
import org.finos.toolbox.time.{DefaultClock, TestFriendlyClock}
import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.core.filter.FilterClause
import org.finos.vuu.core.table.DefaultColumnNames.CreatedTimeColumnName
import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}
import org.finos.vuu.core.table.{Columns, InMemDataTable, RowWithData, ViewPortColumnCreator}
import org.finos.vuu.test.TestFriendlyJoinTableProvider

object FilterAndSortFixture {
  private val timeProvider = new TestFriendlyClock(10001L)
  val now: Long = timeProvider.now();
  val previousHour: Long = now - 3600000;
  val nextHour: Long = now + 3600000;


  def getFilteredRows(table: InMemDataTable, clause: FilterClause): Iterable[RowWithData] = {
    val vpColumns = ViewPortColumnCreator.create(table, table.columns().map(_.name).toList)
    val filter = AntlrBasedFilter(clause)
    val resultKeys = filter.dofilter(table, table.primaryKeys, vpColumns)
    val resultRows = resultKeys.map(key => table.pullRow(key, vpColumns).asInstanceOf[RowWithData])
    resultRows
  }

  def assertRows(result: Set[RowWithData], expected: Set[RowWithData]): Unit = {
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
    val viewPortColumns = ViewPortColumnCreator.create(table, table.columns().map(_.name).toList)
    val result = sort.doSort(table, table.primaryKeys, viewPortColumns)
    val vpColumns = ViewPortColumnCreator.create(table, table.columns().map(_.name).toList)
    val asTable = result.toArray.map(key => (key, table.pullRow(key, vpColumns).asInstanceOf[RowWithData])).toList
    asTable
  }

  def setupTable(): InMemDataTable = {
    setupTable(List.empty,
      row("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1)),
      row("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2)),
      row("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3)),
      row("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4)),
      row("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5)),
      row("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6)),
      row("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7)),
    )
  }

  def setupTable2(): InMemDataTable = {
    setupTable(indices = List("orderId", "ric", "tradeTime", "onMkt", "price", "lastUpdated"), rows =
      row("tradeTime" -> 5L, "quantity" -> null, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(227.88), "lastUpdated" -> EpochTimestamp(1)),
      row("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.12), "lastUpdated" -> EpochTimestamp(2)),
      row("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.20), "lastUpdated" -> EpochTimestamp(3)),
      row("tradeTime" -> 3L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.13), "lastUpdated" -> EpochTimestamp(4)),
      row("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "price" -> Decimal(204.21), "lastUpdated" -> EpochTimestamp(5)),
      row("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.14), "lastUpdated" -> EpochTimestamp(6)),
      row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.15), "lastUpdated" -> EpochTimestamp(7)),
      row("tradeTime" -> 6L, "quantity" -> 105.0d, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.16), "lastUpdated" -> EpochTimestamp(8)),
      row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "price" -> Decimal(87.17), "lastUpdated" -> EpochTimestamp(9)),
      //unicode in trade name and special char in ccycross
      row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "price" -> Decimal(87.18), "lastUpdated" -> EpochTimestamp(10)),
    )
  }

  def setupTableWithCreationTime(): InMemDataTable = {
    setupTable(List.empty,
      row("tradeTime" -> 5L, "quantity" -> 500.0d, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", CreatedTimeColumnName -> previousHour),
      row("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", CreatedTimeColumnName -> now),
      row("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", CreatedTimeColumnName -> nextHour),
      row("tradeTime" -> 3L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", CreatedTimeColumnName -> previousHour),
      row("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", CreatedTimeColumnName -> now),
      row("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", CreatedTimeColumnName -> nextHour)
    )
  }

  def setupTable(indices: List[String], rows: RowWithData*): InMemDataTable = {
    val columns = Columns.fromNames(
      "orderId:String",
      "trader:String",
      "ric:String",
      "tradeTime:Long",
      "quantity:Double",
      "ccyCross:String",
      "onMkt:Boolean",
      "lastUpdated:EpochTimestamp",
      "price:Decimal",
    )
    val tableDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = columns,
      indices = Indices(indices.map(Index): _*),
      joinFields = "ric", "orderId", "ccyCross"
    )
    val table: InMemDataTable = new InMemDataTable(tableDef, new TestFriendlyJoinTableProvider)(new MetricsProviderImpl, new DefaultClock)
    rows.foreach(row => table.processUpdate(row.key, row))
    table
  }

  def row(data: (String, Any)*): RowWithData = {
    val map = Map.newBuilder[String, Any].addAll(data).result()
    RowWithData(map("orderId").toString, map)
  }
}
