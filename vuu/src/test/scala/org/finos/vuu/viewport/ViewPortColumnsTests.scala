package org.finos.vuu.viewport

import org.finos.vuu.core.table.Columns
import org.scalatest.featurespec.AnyFeatureSpec

class ViewPortColumnsTests extends AnyFeatureSpec {

  Feature("compare two view port columns") {

    Scenario("when all the columns names are same equality check should return true") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = new ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val newVPColumns = new ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns == newVPColumns)
    }

    Scenario("when all the columns names are same in different order equality check should return true") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = new ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("secondColumn:String", "firstColumn:String")
      val newVPColumns = new ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns == newVPColumns)
    }

    Scenario("when one if the column has different type equality check should return false") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = new ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("firstColumn:String", "secondColumn:Int")
      val newVPColumns = new ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns != newVPColumns)
    }

    Scenario("when one if the column has different name equality check should return false") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = new ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("firstColumn:String", "someOtherColumn:String")
      val newVPColumns = new ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns != newVPColumns)
    }

    Scenario("when all the columns not same equality check should return false") {
      val sourceColumn = Columns.fromNames("firstColumn:String", "secondColumn:String")
      val oldVPColumns = new ViewPortColumns(sourceColumn.toList)
      val sourceColumn2 = Columns.fromNames("firstColumn:String")
      val newVPColumns = new ViewPortColumns(sourceColumn2.toList)

      assert(oldVPColumns != newVPColumns)
    }
  }
}
