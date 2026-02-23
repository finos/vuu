package org.finos.vuu.core.table

import org.finos.toolbox.time.TestFriendlyClock
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class InMemRowDataMergerTest extends AnyFeatureSpec with Matchers {

  // Setup constants for testing
  private val KEY = "row-123"
  private val FIXED_TIME = 1708639342000L // Some fixed epoch
  private val clock = new TestFriendlyClock(FIXED_TIME)
  private val merger = InMemRowDataMerger(clock)

  Feature("InMemRowDataMerger.mergeLeftToRight") {

    Scenario("Merging an update into EmptyRowData (New Row Creation)") {
      val update = RowWithData(KEY, Map("price" -> 100.50, "side" -> "Buy"))
      val original = EmptyRowData

      val result = merger.mergeLeftToRight(update, original)

      result match {
        case res: RowWithData =>
          res.key shouldBe KEY
          res.data("price") shouldBe 100.50
          res.data("side") shouldBe "Buy"

          // Verify Default Columns
          res.data(DefaultColumn.CREATED_TIME.name) shouldBe EpochTimestamp(FIXED_TIME)
          res.data(DefaultColumn.LAST_UPDATED_TIME.name) shouldBe EpochTimestamp(FIXED_TIME)

        case _ => fail("Result should be RowWithData")
      }
    }

    Scenario("Merging an update into existing RowWithData (Update)") {
      val originalTime = FIXED_TIME - 10000
      val originalData = Map(
        "price" -> 99.00,
        DefaultColumn.CREATED_TIME.name -> EpochTimestamp(originalTime),
        DefaultColumn.LAST_UPDATED_TIME.name -> EpochTimestamp(originalTime)
      )
      val original = RowWithData(KEY, originalData)

      val update = RowWithData(KEY, Map("price" -> 101.00, "quantity" -> 500))

      val result = merger.mergeLeftToRight(update, original)

      result match {
        case res: RowWithData =>
          res.key shouldBe KEY
          // Updated field
          res.data("price") shouldBe 101.00
          // New field
          res.data("quantity") shouldBe 500
          // Created time should stay the same (from original map)
          res.data(DefaultColumn.CREATED_TIME.name) shouldBe EpochTimestamp(originalTime)
          // Last updated time should be NEW
          res.data(DefaultColumn.LAST_UPDATED_TIME.name) shouldBe EpochTimestamp(FIXED_TIME)

        case _ => fail("Result should be RowWithData")
      }
    }

    Scenario("Updating with EmptyRowData should return EmptyRowData") {
      val update = EmptyRowData
      val original = RowWithData(KEY, Map("Field" -> "Value"))

      val result = merger.mergeLeftToRight(update, original)

      result shouldBe EmptyRowData
    }

  }
}