package org.finos.toolbox.collection.window

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ArrayBackedMovingWindowTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Moving Window Data Operations") {

    Scenario("Basic reading, writing, and range verification") {
      Given("an empty array-backed moving window of size 5")
      val window = new ArrayBackedMovingWindow[String](initialSize = 5)

      Then("the initial window range should be [0, 5)")
      window.getRange shouldBe WindowRange(0, 5)

      And("indices within [0, 5) should report as within range")
      window.isWithinRange(2) shouldBe true
      window.isWithinRange(5) shouldBe false

      When("data is set at valid indices")
      window.setAtIndex(2, "Alpha")
      window.setAtIndex(4, "Beta")

      Then("the data should be successfully retrievable")
      window.getAtIndex(2) shouldBe Some("Alpha")
      window.getAtIndex(4) shouldBe Some("Beta")

      And("uninitialized or out-of-bounds indices should return None")
      window.getAtIndex(0) shouldBe None
      window.getAtIndex(5) shouldBe None

      When("the internal iterator is evaluated")
      val iteratedElements = window.iterator.toList

      Then("the iterator must reflect the explicit entries and preserve raw nulls for empty slots")
      iteratedElements shouldBe List(null, null, "Alpha", null, "Beta")
    }

    Scenario("Creating an independent structural copy") {
      Given("a moving window containing data")
      val window = new ArrayBackedMovingWindow[String](initialSize = 3)
      window.setAtIndex(0, "Original")

      When("a copy of the window is created")
      val windowCopy = window.copy()

      Then("the copy should initially contain the same data")
      windowCopy.getAtIndex(0) shouldBe Some("Original")

      When("the copy is mutated and the original window's range is shifted away entirely")
      windowCopy.setAtIndex(1, "Mutation")
      window.setRange(5, 8)

      Then("the original window should remain unaffected by the copy's mutation")
      window.getAtIndex(1) shouldBe None

      And("the copy's range should remain unchanged")
      windowCopy.getRange shouldBe WindowRange(0, 3)

      When("both iterators are evaluated independently")
      val originalIteratorElements = window.iterator.toList
      val copyIteratorElements = windowCopy.iterator.toList

      Then("the original iterator should reflect its new empty shifted state")
      originalIteratorElements shouldBe List(null, null, null)

      And("the copy iterator should independently preserve both the original data and its own mutation")
      copyIteratorElements shouldBe List("Original", "Mutation", null)
    }
  }

  Feature("Window Range Shifts and Data Retention") {

    Scenario("Shifting the window to a partially overlapping range") {
      Given("a window spanning [0, 5) with data at indexes 2 and 4")
      val window = new ArrayBackedMovingWindow[String](initialSize = 5)
      window.setAtIndex(2, "KeepMe")
      window.setAtIndex(4, "DropMe")

      When("the range is shifted from [0, 5) to [2, 7)")
      window.setRange(2, 7)

      Then("the new range should be applied")
      window.getRange shouldBe WindowRange(2, 7)

      And("data falling within the overlapping region [2, 5) should be retained")
      window.getAtIndex(2) shouldBe Some("KeepMe")
      window.getAtIndex(4) shouldBe Some("DropMe")

      And("indices outside the new range should no longer be accessible")
      window.isWithinRange(0) shouldBe false

      When("the internal iterator is evaluated after the partial shift")
      val iteratedElements = window.iterator.toList

      Then("the shifted array data must realign to the new 0-offset index mappings")
      // "KeepMe" (index 2) maps to array index 0 (2 - 2)
      // "DropMe" (index 4) maps to array index 2 (4 - 2)
      iteratedElements shouldBe List("KeepMe", null, "DropMe", null, null)
    }

    Scenario("Shifting the window to a completely non-overlapping range") {
      Given("a window spanning [0, 4) populated with data")
      val window = new ArrayBackedMovingWindow[String](initialSize = 4)
      window.setAtIndex(0, "DataA")
      window.setAtIndex(2, "DataB")

      When("the window range is shifted to a completely detached range [10, 14)")
      window.setRange(10, 14)

      Then("the new range should update successfully")
      window.getRange shouldBe WindowRange(10, 14)

      And("all historical data from the old range should be missing")
      window.getAtIndex(0) shouldBe None
      window.getAtIndex(2) shouldBe None

      When("the internal iterator is retrieved and evaluated")
      val iteratedElements = window.iterator.toList

      Then("the iterator size must match the buffer capacity")
      iteratedElements.size shouldBe 4

      And("it must explicitly yield raw null values for the uninitialized spaces")
      iteratedElements shouldBe List(null, null, null, null)
    }

    Scenario("Expanding the window range to a larger, completely non-overlapping range") {
      Given("a window initialized with an initial size of 3")
      val window = new ArrayBackedMovingWindow[String](initialSize = 3)

      When("the caller shifts and expands the window range to a size of 5 (from 10 to 15)")
      window.setRange(10, 15)

      Then("the new range and expanded buffer size should be successfully applied")
      window.getRange shouldBe WindowRange(10, 15)
      window.bufferSize shouldBe 5

      When("the internal iterator is evaluated after the expansion")
      val iteratedElements = window.iterator.toList

      Then("it should return an expanded structure containing exactly 5 null elements")
      iteratedElements shouldBe List(null, null, null, null, null)
    }
  }
}
