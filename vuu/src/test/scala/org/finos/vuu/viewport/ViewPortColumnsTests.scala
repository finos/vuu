package org.finos.vuu.viewport

import org.finos.vuu.core.table.Columns
import org.scalatest.featurespec.AnyFeatureSpec

class ViewPortColumnsTests extends AnyFeatureSpec {

  Feature("Construction") {
    Scenario("Check basic behaviour") {
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
