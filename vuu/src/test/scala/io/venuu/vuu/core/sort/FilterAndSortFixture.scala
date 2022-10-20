package io.venuu.vuu.core.sort

import io.venuu.toolbox.collection.MapDiffUtils
import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.text.{AsciiUtil, CodeGenUtil}
import io.venuu.vuu.api.{Index, Indices, TableDef}
import io.venuu.vuu.core.table.{Columns, RowWithData, SimpleDataTable}
import io.venuu.vuu.provider.TestFriendlyJoinTableProvider

object FilterAndSortFixture {

  def expectRows(result: List[(String,RowWithData)])(expectedFn: => List[RowWithData]): Unit = {
    expectRows(result, expectedFn)
  }

  def expectRows(result: List[(String,RowWithData)], expected:  List[RowWithData]): Unit ={

    val resultAsMap = Map("rows" -> result.map( rwd => rwd._2.data ))
    val expectedAsMap = Map("rows" -> expected.map( rwd => rwd.data ))

    val diff = MapDiffUtils.diff(resultAsMap, expectedAsMap)

    if(diff.hasDiff){

      printActual(result)

      val headers = Array("exp key", "exp val", "exp datatype", "act key", "act val", "act datatype")

      val leftNotRight = diff.leftNotRight.map( kpv => Array[Any]("", "", "", kpv.path, kpv.value, kpv.theType)).toArray
      val rightNotLeft = diff.rightNotLeft.map( kpv => Array[Any](kpv.path, kpv.value, kpv.theType, "", "", "")).toArray
      val bothButDiff  = diff.bothButDiff.map( tup => {
        val left = tup._1
        val right = tup._2

        Array[Any](left.path, left.value, left.theType, right.path, right.value, right.theType)
      }).toArray[Array[Any]]

      val data = leftNotRight ++ rightNotLeft ++ bothButDiff

      println(AsciiUtil.asAsciiTable(headers, data))

      assert(false == true, "has diffs")
    }
  }


  def doSort(table: SimpleDataTable, sort: GenericSort): List[(String, RowWithData)] = {
    //val genSort = GenericSort(SortSpec(List(SortDef("quantity", 'A'), SortDef("orderId", 'D'))), table.columnsForNames("quantity", "orderId") )

    val result = sort.doSort(table, table.primaryKeys)

    val asTable = result.toArray.map( key => ( (key, table.pullRow(key, table.columns().toList).asInstanceOf[RowWithData] ) ) ).toList

    asTable
  }

  def printActual(actual : List[(String, RowWithData)]) = {
    val s = "List(\n" +
      actual.map({ case(key, rowWData) => {
        "RowWithData(\"" + key + "\"," + CodeGenUtil.mapToString(rowWData.data) + ")"
      }}).mkString(",\n") + "\n)\n"
    println(s)
  }

  def setupTable(): SimpleDataTable = {

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "ccyCross:String", "onMkt:Boolean"),
      joinFields =  "ric", "orderId", "ccyCross")

    implicit val metrics = new MetricsProviderImpl

    implicit val table = new SimpleDataTable(ordersDef, new TestFriendlyJoinTableProvider())

    def addRow(rowWithData: RowWithData)(implicit table: SimpleDataTable) = {
      table.processUpdate(rowWithData.key, rowWithData, 0l)
    }

    val rows = List(
      RowWithData("NYC-0004",Map("tradeTime" -> 5l,"quantity" -> 500.0d,"ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD")),
      RowWithData("LDN-0001",Map("tradeTime" -> 2l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0001","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
      RowWithData("LDN-0002",Map("tradeTime" -> 1l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
      RowWithData("LDN-0003",Map("tradeTime" -> 3l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0003","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
      RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
      RowWithData("NYC-0002",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0002","onMkt" -> false,"trader" -> "steve","ccyCross" -> "GBPUSD")),
      RowWithData("NYC-0010",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0010","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD"))
    )

    rows.foreach(r => addRow(r))

    table
  }

  def setupTable2(): SimpleDataTable = {

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "ccyCross:String", "onMkt:Boolean"),
      indices = Indices(
        Index("orderId"),
        Index("ric"),
        Index("tradeTime"),
        Index("onMkt")
      ),
      joinFields =  "ric", "orderId", "ccyCross"
    )

    implicit val metrics = new MetricsProviderImpl

    implicit val table = new SimpleDataTable(ordersDef, new TestFriendlyJoinTableProvider())

    def addRow(rowWithData: RowWithData)(implicit table: SimpleDataTable) = {
      table.processUpdate(rowWithData.key, rowWithData, 0l)
    }

    val rows = List(
      RowWithData("NYC-0004",Map("tradeTime" -> 5l,"quantity" -> null,"ric" -> "AAPL.L","orderId" -> "NYC-0004","onMkt" -> false,"trader" -> "chris","ccyCross" -> "GBPUSD")),
      RowWithData("LDN-0001",Map("tradeTime" -> 2l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "LDN-0001","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
      RowWithData("LDN-0002",Map("tradeTime" -> 1l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0002","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
      RowWithData("LDN-0003",Map("tradeTime" -> 3l,"quantity" -> null,"ric" -> "VOD.L","orderId" -> "LDN-0003","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
      RowWithData("LDN-0008",Map("tradeTime" -> 5l,"quantity" -> 100.0d,"ric" -> "BT.L","orderId" -> "LDN-0008","onMkt" -> true,"trader" -> "chris","ccyCross" -> "GBPUSD")),
      RowWithData("NYC-0002",Map("tradeTime" -> 6l,"quantity" -> 100.0d,"ric" -> "VOD.L","orderId" -> "NYC-0002","onMkt" -> false,"trader" -> "steve","ccyCross" -> "GBPUSD")),
      RowWithData("NYC-0010",Map("tradeTime" -> 6l,"quantity" -> null,"ric" -> "VOD.L","orderId" -> "NYC-0010","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
      RowWithData("NYC-0011",Map("tradeTime" -> 6l,"quantity" -> null,"ric" -> "VOD/L","orderId" -> "NYC-0011","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
      RowWithData("NYC-0012",Map("tradeTime" -> 6l,"quantity" -> null,"ric" -> "VOD\\L","orderId" -> "NYC-0012","onMkt" -> true,"trader" -> "steve","ccyCross" -> "GBPUSD")),
      //unicode in trade name and special char in ccycross
      RowWithData("NYC-0013",Map("tradeTime" -> 6l,"quantity" -> null,"ric" -> "VOD\\L","orderId" -> "NYC-0013","onMkt" -> true,"trader" -> "rahúl","ccyCross" -> "$GBPUSD"))
    )

    rows.foreach(r => addRow(r))

    table
  }

}
