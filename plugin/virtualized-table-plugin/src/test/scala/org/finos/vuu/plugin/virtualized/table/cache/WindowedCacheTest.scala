package org.finos.vuu.plugin.virtualized.table.cache

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowData
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

class WindowedCacheTest
  extends AnyFeatureSpec
    with GivenWhenThen
    with Matchers
    with MockitoSugar {

  Feature("WindowedCache factory and operations") {

    Scenario("Creating a WindowedCache instance via companion object factory") {
      Given("a Clock instance provided in context")
      given mockClock: Clock = mock[Clock]

      When("instantiating a WindowedCache with a specific size")
      val cacheSize = 100
      val cache = WindowedCache(cacheSize)

      Then("the cache instance should be created successfully as a CaffeineWindowedRowDataCache")
      cache should not be null
      cache shouldBe a[CaffeineWindowedRowDataCache]
    }

    Scenario("Putting, getting, and updating entries in WindowedCache") {
      Given("a WindowedCache initialized with size 10")
      given mockClock: Clock = mock[Clock]
      val cache = WindowedCache(10)

      val mockRow1 = mock[RowData]
      val mockRow2 = mock[RowData]

      When("putting a new key-value pair")
      val putResult1 = cache.put("row-1", mockRow1)

      Then("put should return None for a previously unseen key")
      putResult1 shouldBe None

      And("getting the key should return the value in a Some wrapper")
      cache.get("row-1") shouldBe Some(mockRow1)

      When("updating an existing key with a new value")
      val putResult2 = cache.put("row-1", mockRow2)

      Then("put should return the previous value")
      putResult2 shouldBe Some(mockRow1)

      And("getting the key should now return the updated value")
      cache.get("row-1") shouldBe Some(mockRow2)
    }

    Scenario("Removing specific keys and non-existent keys") {
      Given("a WindowedCache populated with an entry")
      given mockClock: Clock = mock[Clock]
      val cache = WindowedCache(10)

      val mockRow = mock[RowData]
      cache.put("row-1", mockRow)

      When("removing an existing key")
      val removedValue = cache.remove("row-1")

      Then("remove should return the removed value")
      removedValue shouldBe Some(mockRow)

      And("subsequent get operations for that key should return None")
      cache.get("row-1") shouldBe None

      When("removing a non-existent key")
      val removeNonExistent = cache.remove("row-1")

      Then("remove should return None")
      removeNonExistent shouldBe None
    }

    Scenario("Clearing all cached entries using removeAll") {
      Given("a WindowedCache populated with multiple entries")
      given mockClock: Clock = mock[Clock]
      val cache = WindowedCache(10)

      val mockRow1 = mock[RowData]
      val mockRow2 = mock[RowData]

      cache.put("row-1", mockRow1)
      cache.put("row-2", mockRow2)

      When("calling removeAll on the cache")
      cache.removeAll()

      Then("all previously cached keys should return None")
      cache.get("row-1") shouldBe None
      cache.get("row-2") shouldBe None
    }
  }
}