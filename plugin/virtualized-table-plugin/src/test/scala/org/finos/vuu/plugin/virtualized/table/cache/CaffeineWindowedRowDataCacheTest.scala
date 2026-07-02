package org.finos.vuu.plugin.virtualized.table.cache

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowData
import org.scalamock.scalatest.MockFactory
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class CaffeineWindowedRowDataCacheTest extends AnyFeatureSpec
  with Matchers
  with GivenWhenThen
  with MockFactory {

  // Mock the implicit Clock required by the constructor
  implicit val mockClock: Clock = mock[Clock]

  Feature("Caffeine Backed Windowed RowData Cache Management") {

    Scenario("Standard put, get, and overwrite lifecycles") {
      Given("a row cache initialized with a maximum capacity of 5")
      val cacheSize = 5
      val rowCache = new CaffeineWindowedRowDataCache(cacheSize)
      val mockRowData1 = mock[RowData]
      val mockRowData2 = mock[RowData]

      When("a completely new row data entry is cached")
      val initialPutResult = rowCache.put("row-1", mockRowData1)

      Then("the put operation should return None indicating no previous value existed")
      initialPutResult shouldBe None

      And("the entry must be retrievable via its identifier key")
      rowCache.get("row-1") shouldBe Some(mockRowData1)

      When("overwriting the existing key with new row data")
      val overwriteResult = rowCache.put("row-1", mockRowData2)

      Then("the put operation must return the previous row data instance")
      overwriteResult shouldBe Some(mockRowData1)

      And("the cache must reflect the updated data entry mapping")
      rowCache.get("row-1") shouldBe Some(mockRowData2)
    }

    Scenario("Defensive boundary sanitation when handling null keys") {
      Given("an operational row cache instance")
      val rowCache = new CaffeineWindowedRowDataCache(10)
      val mockRowData = mock[RowData]

      When("attempting to interact with the cache using a null key pointer")
      val putResult = rowCache.put(null, mockRowData)
      val getResult = rowCache.get(null)
      val removeResult = rowCache.remove(null)

      Then("all operations must gracefully return None instead of throwing a NullPointerException")
      putResult shouldBe None
      getResult shouldBe None
      removeResult shouldBe None
    }

    Scenario("Eviction execution when insertions breach the cache size threshold") {
      Given("a highly constrained row cache capped strictly at a maximum size of 2")
      val cacheSize = 2
      val rowCache = new CaffeineWindowedRowDataCache(cacheSize)
      val row1 = mock[RowData]
      val row2 = mock[RowData]
      val row3 = mock[RowData]

      And("the cache is filled completely to its capacity boundary")
      rowCache.put("key-1", row1)
      rowCache.put("key-2", row2)

      When("an additional 3rd item is inserted into the cache layout")
      rowCache.put("key-3", row3)

      And("forcing a synchronous Caffeine cache maintenance cycle processing step")
      rowCache.cache.cleanUp()

      Then("the aggregate total cached items size must still comply with the limit of 2")
      rowCache.cache.estimatedSize() shouldBe 2

      And("at least one historical item must have been dropped to accommodate the newest key")
      val trackingList = List(rowCache.get("key-1"), rowCache.get("key-2"), rowCache.get("key-3"))
      trackingList.flatten.size shouldBe 2
    }

    Scenario("Explicit selective key removals and full cache invalidations") {
      Given("a cache populated with multiple distinct row items")
      val rowCache = new CaffeineWindowedRowDataCache(5)
      val targetRow = mock[RowData]
      val fallbackRow = mock[RowData]

      rowCache.put("target-key", targetRow)
      rowCache.put("fallback-key", fallbackRow)

      When("an explicit single-key removal request is processed for the target key")
      val removedItem = rowCache.remove("target-key")

      Then("the operation must return the exact row data instance dropped")
      removedItem shouldBe Some(targetRow)

      And("the key must no longer exist inside the active cache state map")
      rowCache.get("target-key") shouldBe None
      rowCache.get("fallback-key") shouldBe Some(fallbackRow)

      When("a complete cache structural invalidation is triggered via removeAll")
      rowCache.removeAll()

      Then("the underlying cache must be completely cleared of all entries")
      rowCache.cache.estimatedSize() shouldBe 0
      rowCache.get("fallback-key") shouldBe None
    }
  }
}
