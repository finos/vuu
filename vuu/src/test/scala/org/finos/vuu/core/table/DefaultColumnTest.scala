package org.finos.vuu.core.table

import org.finos.vuu.api.{Indices, TableDef}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DefaultColumnTest extends AnyFeatureSpec with Matchers {

  Feature("Default column tests") {

    Scenario("Check default column count") {

      DefaultColumn.values.length shouldEqual 2

    }

    Scenario("Check created time column") {

      val createdTime = DefaultColumn.CreatedTime

      createdTime.name shouldEqual "vuuCreatedTimestamp"
      createdTime.dataType.isInstanceOf[DataType.LongDataType.type] shouldBe true
    }

    Scenario("Check last updated time column") {

      val lastUpdatedTime = DefaultColumn.LastUpdatedTime

      lastUpdatedTime.name shouldEqual "vuuUpdatedTimestamp"
      lastUpdatedTime.dataType.isInstanceOf[DataType.LongDataType.type] shouldBe true
    }

    Scenario("Default columns are created as expected") {

      val customColumn: Column = SimpleColumn("name", 0, DataType.StringDataType)

      val result = DefaultColumn.getDefaultColumns(Array(customColumn))

      result.length shouldEqual 2
      //result.head shouldEqual customColumn
      //DefaultColumn.isDefaultColumn(result.head) shouldBe false
      result(0).name shouldEqual DefaultColumn.CreatedTime.name
      result(0).index shouldEqual 1
      DefaultColumn.isDefaultColumn(result(0)) shouldBe true
      result(1).name shouldEqual DefaultColumn.LastUpdatedTime.name
      result(1).index shouldEqual 2
      DefaultColumn.isDefaultColumn(result(1)) shouldBe true
    }

    Scenario("Default columns are added to TableDef as expected") {
      val customColumn: Column = SimpleColumn("keyCol", 0, DataType.StringDataType)
      val tableDef: TableDef = new TableDef(
        name = "myTable",
        keyField = "keyCol",
        customColumns = Array(customColumn),
        joinFields = Seq.empty,
        indices = Indices(),
        includeDefaultColumns = true)
      val result = tableDef.getColumns

      result.length shouldEqual 3
      result.head shouldEqual customColumn
      DefaultColumn.isDefaultColumn(result.head) shouldBe false
      result(1).name shouldEqual DefaultColumn.CreatedTime.name
      DefaultColumn.isDefaultColumn(result(1)) shouldBe true
      result(2).name shouldEqual DefaultColumn.LastUpdatedTime.name
      DefaultColumn.isDefaultColumn(result(2)) shouldBe true
    }

    Scenario("Default columns are not included") {
      val customColumn: Column = SimpleColumn("keyCol", 0, DataType.StringDataType)
      val tableDef: TableDef = new TableDef(
        name = "myTable",
        keyField = "keyCol",
        customColumns = Array(customColumn),
        joinFields = Seq.empty,
        indices = Indices(),
        includeDefaultColumns = false)
      val result = tableDef.getColumns

      result.length shouldEqual 1
      result.head shouldEqual customColumn
      DefaultColumn.isDefaultColumn(result.head) shouldBe false
    }

  }


}
