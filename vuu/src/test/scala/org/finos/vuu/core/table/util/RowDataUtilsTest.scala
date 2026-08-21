package org.finos.vuu.core.table.util

import org.finos.vuu.core.table.RowWithData
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RowDataUtilsTest extends AnyFeatureSpec with Matchers {
  private val rowData = RowWithData("myKey", Map(
    "key" -> "myKey",
    "id" -> 123L,
    "someId" -> Some(123L),
    "name" -> "user1",
    "someName" -> Some("user1"),
    "noneCol" -> None
  ))

  Feature("getRequiredLong") {

    Scenario("getRequiredLong should throw when rowData is null") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredLong(null, "any")
      }
    }

    Scenario("getRequiredLong should throw when columnName is null") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredLong(rowData, null)
      }
    }

    Scenario("getRequiredLong should return a Long") {
      RowDataUtils.getRequiredLong(rowData, "id") shouldBe 123L
    }

    Scenario("getRequiredLong should unwrap Some(Long)") {
      RowDataUtils.getRequiredLong(rowData, "someId") shouldBe 123L
    }

    Scenario("getRequiredLong should throw when column is not in RowData") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredLong(rowData, "dummy")
      }
    }

    Scenario("getRequiredLong should throw when value is None") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredLong(rowData, "noneCol")
      }
    }

    Scenario("getRequiredLong should throw when value is not a Long") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredLong(rowData, "name")
      }
    }
  }

  Feature("getRequiredString") {

    Scenario("getRequiredString should throw when rowData is null") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredString(null, "any")
      }
    }

    Scenario("getRequiredString should throw when columnName is null") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredString(rowData, null)
      }
    }

    Scenario("getRequiredString should return a String") {
      RowDataUtils.getRequiredString(rowData, "name") shouldBe "user1"
    }

    Scenario("getRequiredString should unwrap Some(String)") {
      RowDataUtils.getRequiredString(rowData, "someName") shouldBe "user1"
    }

    Scenario("getRequiredString should throw when column is not in RowData") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredString(rowData, "dummy")
      }
    }

    Scenario("getRequiredString should throw when value is None") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredString(rowData, "noneCol")
      }
    }

    Scenario("getRequiredString should throw when value is not a String") {
      an[RowDataUtils.RowDataException] should be thrownBy {
        RowDataUtils.getRequiredString(rowData, "id")
      }
    }
  }

  Feature("getString") {

    Scenario("getString should return null when rowData is null") {
      RowDataUtils.getString(null, "any") shouldBe null
    }

    Scenario("getString should return null when columnName is null") {
      RowDataUtils.getString(rowData, null) shouldBe null
    }

    Scenario("getString should return a String") {
      RowDataUtils.getString(rowData, "name") shouldBe "user1"
    }

    Scenario("getString should unwrap Some(String)") {
      RowDataUtils.getString(rowData, "someName") shouldBe "user1"
    }

    Scenario("getString should return null when column is not in RowData") {
      RowDataUtils.getString(rowData, "dummy") shouldBe null
    }

    Scenario("getString should return null when value is None") {
      RowDataUtils.getString(rowData, "noneCol") shouldBe null
    }

    Scenario("getString should return null when value is not a String") {
      RowDataUtils.getString(rowData, "id") shouldBe null
    }
  }
}