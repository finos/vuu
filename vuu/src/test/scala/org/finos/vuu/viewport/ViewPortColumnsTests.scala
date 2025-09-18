package org.finos.vuu.viewport

import org.finos.vuu.api.{JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef, VisualLinks}
import org.finos.vuu.core.table.{Columns, DataType, ViewPortColumnCreator}
import org.scalatest.featurespec.AnyFeatureSpec

class ViewPortColumnsTests extends AnyFeatureSpec {

  Feature("Basic operations") {

    Scenario("Simple viewport with no joins or calculated columns") {
      val columns = Columns.fromNames("firstColumn:String", "secondColumn:String").toList
      val vpColumns = ViewPortColumns(columns)

      assert(vpColumns.getColumns == columns)
      assert(vpColumns.columnExists("firstColumn"))
      assert(vpColumns.getColumnForName("firstColumn").get == columns.head)
      assert(!vpColumns.columnExists("thirdColumn"))
      assert(!vpColumns.hasJoinColumns)
      assert(vpColumns.getJoinColumnsByTable.isEmpty)
      assert(!vpColumns.hasCalculatedColumns)
      assert(vpColumns.getCalculatedColumns.isEmpty)
    }

    Scenario("Viewport with joins") {
      val ordersDef = TableDef(
        name = "orders",
        keyField = "orderId",
        columns = Columns.fromNames("orderId:String", "trader:String", "ric:String"),
        joinFields =  "ric", "orderId")

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double"), "ric")

      val joinDef = JoinTableDef(
        name          = "orderPrices",
        baseTable     = ordersDef,
        joinColumns   = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
        joins  =
          JoinTo(
            table = pricesDef,
            joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
          ),
        links = VisualLinks(),
        joinFields = Seq()
      )

      val vpColumns = ViewPortColumnCreator.create(joinDef, List("orderId", "trader", "ric", "bid"))

      assert(vpColumns.hasJoinColumns)
      val vpColumnsByTable = vpColumns.getJoinColumnsByTable
      assert(vpColumnsByTable.size == 2)
      assert(vpColumnsByTable.contains("orders"))
      assert(vpColumnsByTable("orders").size == 3)
      assert(vpColumnsByTable.contains("prices"))
      assert(vpColumnsByTable("prices").size == 1)
      val orderJoinVpColumns = vpColumns.getJoinViewPortColumns("orders")
      assert(orderJoinVpColumns.isDefined)
      assert(orderJoinVpColumns.get.getColumns.size == 3)
      assert(orderJoinVpColumns.get.getColumns == ordersDef.columns.filter(c => List("orderId", "trader", "ric").contains(c.name)).toList)
      val priceJoinVpColumns = vpColumns.getJoinViewPortColumns("prices")
      assert(priceJoinVpColumns.isDefined)
      assert(priceJoinVpColumns.get.getColumns.size == 1)
      assert(priceJoinVpColumns.get.getColumns == pricesDef.columns.filter(_.name == "bid").toList)
    }

    Scenario("Viewport with calculations") {
      val ordersDef = TableDef(
        name = "orders",
        keyField = "orderId",
        columns = Columns.fromNames("orderId:String", "trader:String", "ric:String"),
        joinFields =  "ric", "orderId")

      val vpColumns = ViewPortColumnCreator.create(ordersDef,
        List("orderId", "trader", "ric", "calcField:String:=concatenate(orderId, trader)"))

      assert(vpColumns.hasCalculatedColumns)
      assert(vpColumns.getCalculatedColumns.size == 1)
      assert(vpColumns.getCalculatedColumns.head.name == "calcField")
      assert(vpColumns.getCalculatedColumns.head.dataType == DataType.StringDataType)
    }

  }

  Feature("compare two view port columns") {

    Scenario("when all the columns names are same equality check should return true and hashcode should be equal") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val newVPColumns = ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns == newVPColumns)
      assert(oldVPColumns.hashCode() == newVPColumns.hashCode())
    }

    Scenario("when all the columns names are same in different order equality check should return false") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("secondColumn:String", "firstColumn:String")
      val newVPColumns = ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns != newVPColumns)
    }

    Scenario("when one if the column has different type equality check should return false") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("firstColumn:String", "secondColumn:Int")
      val newVPColumns = ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns != newVPColumns)
    }

    Scenario("when one if the column has different name equality check should return false") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("firstColumn:String", "someOtherColumn:String")
      val newVPColumns = ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns != newVPColumns)
    }

    Scenario("when all the columns not same equality check should return false") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("firstColumn:String")
      val newVPColumns = ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns != newVPColumns)
    }
  }
}
