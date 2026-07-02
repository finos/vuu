package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.*
import org.scalamock.scalatest.MockFactory
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class VirtualizedSessionTableDataTest extends AnyFeatureSpec
  with Matchers
  with GivenWhenThen
  with MockFactory {

  // Mock the implicit Clock required by the TableData constructor
  implicit val mockClock: Clock = mock[Clock]

  Feature("Virtualized Session Table Data Management") {

    Scenario("Querying data for non-existent or uncached keys") {
      Given("a virtualized session table initialized with a capacity of 10")
      val tableData = new VirtualizedSessionTableData(10)

      When("querying row data for a key that has never been loaded")
      val result = tableData.dataByKey("missing-key")

      Then("the table must return the standardized EmptyRowData sentinel object")
      result shouldBe EmptyRowData
    }

    Scenario("Data lifecycle operations: Insert, Update, and Delete tracking events") {
      Given("a clean virtualized session table instance")
      val table = new VirtualizedSessionTableData(5)
      val initialRow = mock[RowData]
      val updatedRow = mock[RowData]

      When("inserting a completely new row data record into the table layout")
      val insertEvent = table.update("row-1", initialRow)

      Then("the system must interpret this as an insert operation event")
      insertEvent shouldBe TableDataInserted(table, initialRow)
      table.dataByKey("row-1") shouldBe initialRow

      When("updating the exact same key index mapping with new record values")
      val updateEvent = table.update("row-1", updatedRow)

      Then("the system must identify the overwrite and return a TableDataUpdated tracking token")
      updateEvent shouldBe TableDataUpdated(table, initialRow, updatedRow)
      table.dataByKey("row-1") shouldBe updatedRow

      When("explicitly deleting the row record from the tracked cache context")
      val deleteEvent = table.delete("row-1")

      Then("the table must signal a structural deletion event containing the dropped data")
      deleteEvent shouldBe TableDataDeleted(table, updatedRow)
      table.dataByKey("row-1") shouldBe EmptyRowData

      When("attempting to delete a key that no longer exists in memory storage")
      val subsequentDeleteEvent = table.delete("row-1")

      Then("it should return a TableDataNothingDeleted tracking state")
      subsequentDeleteEvent shouldBe TableDataNothingDeleted
    }

    Scenario("Mass invalidation drops all tracking records") {
      Given("a virtualized table populated with active data keys")
      val table = new VirtualizedSessionTableData(5)
      val dummyRow = mock[RowData]
      table.update("k1", dummyRow)
      table.update("k2", dummyRow)

      When("triggering a complete data purge sequence via deleteAll")
      val resultTable = table.deleteAll()

      Then("the method must return a reference back to the operating table instance itself")
      resultTable shouldBe table

      And("all previous keys must immediately resolve to EmptyRowData points")
      table.dataByKey("k1") shouldBe EmptyRowData
      table.dataByKey("k2") shouldBe EmptyRowData
    }

    Scenario("Primary key updates") {
      Given("an operational virtualized table instance")
      val table = new VirtualizedSessionTableData(10)

      When("setting the length")
      table.setLength(5000)

      And("setting the range")
      table.setRangeForKeys(100, 110)

      And("setting keys")
      table.setKeyAt(102, "absolute-row-102")
      table.setKeyAt(105, "absolute-row-105")

      Then("the primary keys should have the new values and correct size")
      val primaryKeys = table.primaryKeyValues
      primaryKeys shouldNot be(null)
      primaryKeys.get(102) shouldBe "absolute-row-102"
      primaryKeys.get(105) shouldBe "absolute-row-105"
      primaryKeys.length shouldBe 5000
    }
  }
}