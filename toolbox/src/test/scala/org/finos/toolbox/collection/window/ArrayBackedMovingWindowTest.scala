package org.finos.toolbox.collection.window

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ArrayBackedMovingWindowTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Dynamic Moving Window Resizing and Data Preservation") {

    Scenario("Expanding the window range dynamically grows the buffer size") {
      Given("a moving window initialized with an initial size of 3")
      val window = new ArrayBackedMovingWindow[String](3)
      window.setAtIndex(0, "A")
      window.setAtIndex(1, "B")
      window.setAtIndex(2, "C")

      When("the window range is expanded to a larger span [0, 6)")
      window.setRange(0, 6)

      Then("the bufferSize property must dynamically grow to match")
      window.bufferSize shouldBe 6

      And("all original data elements must still be accessible at their original indexes")
      window.getAtIndex(0) shouldBe Some("A")
      window.getAtIndex(1) shouldBe Some("B")
      window.getAtIndex(2) shouldBe Some("C")

      And("the newly expanded indices should be empty (None)")
      window.getAtIndex(3) shouldBe None
      window.getAtIndex(5) shouldBe None
    }

    Scenario("Shrinking the window range drops out-of-bounds data and updates size") {
      Given("a window of size 4 containing data entries")
      val window = new ArrayBackedMovingWindow[String](4)
      window.setAtIndex(0, "Drop Me")
      window.setAtIndex(1, "Keep Me")
      window.setAtIndex(2, "Keep Me Too")

      When("the window range is shrunk down to [1, 3)")
      window.setRange(1, 3)

      Then("the buffer size must reflect the smaller configuration")
      window.bufferSize shouldBe 2

      And("retained index positions must preserve their structural data values")
      window.getAtIndex(1) shouldBe Some("Keep Me")
      window.getAtIndex(2) shouldBe Some("Keep Me Too")

      And("dropped coordinates must no longer be within range or retrievable")
      window.isWithinRange(0) shouldBe false
      window.getAtIndex(0) shouldBe None
    }

    Scenario("Moving to a completely disjoint larger range resets data but grows capacity") {
      Given("a window with an active state in range [0, 2)")
      val window = new ArrayBackedMovingWindow[String](2)
      window.setAtIndex(0, "Old Data")

      When("shifting the window to a completely non-overlapping larger range [5, 10)")
      window.setRange(5, 10)

      Then("the new buffer size must match the new range size")
      window.bufferSize shouldBe 5

      And("the old disconnected data elements must not persist or bleed through")
      window.getAtIndex(0) shouldBe None
      window.getAtIndex(5) shouldBe None
    }

    Scenario("Clean iteration behavior across expanded sparse windows") {
      Given("a window expanded to a large size containing scattered records")
      val window = new ArrayBackedMovingWindow[String](2)
      window.setRange(0, 5) // Expanded to size 5
      window.setAtIndex(1, "Data Point X")
      window.setAtIndex(4, "Data Point Y")

      When("collecting values through the iterator context loop")
      val collectedElements = window.iterator.toList

      Then("the list must only expose valid element payloads, skipping internal padding nulls")
      collectedElements shouldBe List("Data Point X", "Data Point Y")
    }
  }

  Feature("Memory Allocation Minimization Strategy") {

    Scenario("Reusing the same array instance when shrinking or shifting within current capacity") {
      Given("a moving window initialized with a capacity of 5")
      val window = new ArrayBackedMovingWindow[String](5)
      window.setAtIndex(2, "Data")
      val originalArrayId = window.internalArrayIdentity

      When("the range is modified but fits within the original capacity (e.g., shrinking to size 3)")
      window.setRange(2, 5)

      Then("the underlying array instance must remain exactly identical")
      window.internalArrayIdentity shouldBe originalArrayId
      window.bufferSize shouldBe 3
      window.getAtIndex(2) shouldBe Some("Data")
    }

    Scenario("Reusing the same array instance during non-overlapping shifts within capacity") {
      Given("a moving window with a capacity of 10")
      val window = new ArrayBackedMovingWindow[String](10)
      val originalArrayId = window.internalArrayIdentity

      When("shifting to a completely disjoint range that still fits within the array length")
      window.setRange(20, 25) // size 5 <= 10

      Then("the array is cleared and reused without triggering a new allocation")
      window.internalArrayIdentity shouldBe originalArrayId
      window.bufferSize shouldBe 5
    }

    Scenario("Allocating a new array only when expanding beyond current maximum capacity") {
      Given("a moving window with a capacity of 3")
      val window = new ArrayBackedMovingWindow[String](3)
      val originalArrayId = window.internalArrayIdentity

      When("the range is expanded to a size greater than 3")
      window.setRange(0, 6)

      Then("the code must adapt and allocate a fresh backing array")
      window.internalArrayIdentity shouldNot be(originalArrayId)
      window.bufferSize shouldBe 6
    }

    Scenario("In-place shift integrity when sliding window left (backward element copy)") {
      Given("a window with capacity 5 tracking range [2, 7)")
      val window = new ArrayBackedMovingWindow[String](5)
      window.setRange(2, 7)
      window.setAtIndex(3, "X")
      window.setAtIndex(4, "Y")
      val originalArrayId = window.internalArrayIdentity

      When("sliding the window left to range [1, 6)")
      window.setRange(1, 6)

      Then("the array must not reallocate")
      window.internalArrayIdentity shouldBe originalArrayId

      And("the data elements must shift right safely without self-corruption")
      window.getAtIndex(3) shouldBe Some("X")
      window.getAtIndex(4) shouldBe Some("Y")
      window.getAtIndex(1) shouldBe None
      window.getAtIndex(6) shouldBe None
    }
  }

}