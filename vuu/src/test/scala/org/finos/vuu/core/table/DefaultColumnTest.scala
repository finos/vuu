package org.finos.vuu.core.table

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DefaultColumnTest extends AnyFeatureSpec with Matchers{

  Feature("Default column tests") {

    Scenario("Check default column count") {

      DefaultColumn.values.length shouldEqual 2

    }

    Scenario("Check created time column") {

      val createdTime = DefaultColumn.CreatedTime

      createdTime.name shouldEqual "vuuCreatedTimestamp"
      createdTime.dataType.isInstanceOf[DataType.EpochTimestampType.type] shouldBe true
    }

    Scenario("Check last updated time column") {

      val lastUpdatedTime = DefaultColumn.LastUpdatedTime

      lastUpdatedTime.name shouldEqual "vuuUpdatedTimestamp"
      lastUpdatedTime.dataType.isInstanceOf[DataType.EpochTimestampType.type] shouldBe true
    }

    Scenario("Default columns are added as expected") {

      val customColumn: Column = SimpleColumn("name", 0, DataType.StringDataType)

      val result = DefaultColumn.addDefaultColumns(Array(customColumn))

      result.length shouldEqual 3
      result.head shouldEqual customColumn
      DefaultColumn.isDefaultColumn(result.head) shouldBe false
      result(1).name shouldEqual DefaultColumn.CreatedTime.name
      DefaultColumn.isDefaultColumn(result(1)) shouldBe true
      result(2).name shouldEqual DefaultColumn.LastUpdatedTime.name
      DefaultColumn.isDefaultColumn(result(2)) shouldBe true
    }


  }


}
