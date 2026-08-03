package org.finos.vuu.viewport
import org.finos.vuu.core.table.RangeSettings
import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers

class ViewPortRangeTest extends AnyFunSuite with Matchers {

  private val defaultSettings = RangeSettings().withMaxRangeEnd(1000).withMaxRangeWidth(100)

  // --- Default objects ---

  test("DefaultRange and EmptyRange are initialized correctly") {
    DefaultRange shouldBe ViewPortRange(0, 100)
    EmptyRange shouldBe ViewPortRange(0, 0)
  }

  // --- contains ---

  test("contains returns true for values within range [from, to)") {
    val range = ViewPortRange(10, 50)

    range.contains(10) shouldBe true   // Boundary (from)
    range.contains(25) shouldBe true   // Middle
    range.contains(49) shouldBe true   // Just inside
    range.contains(50) shouldBe false  // Boundary (to is exclusive)
    range.contains(5)  shouldBe false  // Below
    range.contains(60) shouldBe false  // Above
  }

  // --- isValid ---

  test("isValid returns true for valid ranges within settings bounds") {
    val range = ViewPortRange(0, 50)
    range.isValid(defaultSettings) shouldBe true
  }

  test("isValid fails when 'from' is negative") {
    val range = ViewPortRange(-1, 50)
    range.isValid(defaultSettings) shouldBe false
  }

  test("isValid fails when 'to' is less than 'from'") {
    val range = ViewPortRange(50, 40)
    range.isValid(defaultSettings) shouldBe false
  }

  test("isValid fails when 'to' exceeds maxRangeEnd") {
    val settings = RangeSettings().withMaxRangeEnd(100).withMaxRangeWidth(200)
    val range = ViewPortRange(0, 150)
    range.isValid(settings) shouldBe false
  }

  test("isValid fails when range width exceeds maxRangeWidth") {
    val settings = RangeSettings().withMaxRangeEnd(1000).withMaxRangeWidth(50)
    val range = ViewPortRange(0, 60)
    range.isValid(settings) shouldBe false
  }

  // --- subtract ---

  test("subtract adjusts start when newRange overlaps the right side of current range") {
    val current = ViewPortRange(10, 50)
    val newRange = ViewPortRange(20, 70)

    val result = current.subtract(newRange)

    result shouldBe ViewPortRange(50, 70)
  }

  test("subtract adjusts end when newRange overlaps the left side of current range") {
    val current = ViewPortRange(20, 60)
    val newRange = ViewPortRange(10, 30)

    val result = current.subtract(newRange)

    result shouldBe ViewPortRange(10, 20)
  }

  test("subtract returns original newRange when there is no overlap") {
    val current = ViewPortRange(10, 30)
    val newRange = ViewPortRange(40, 60)

    val result = current.subtract(newRange)

    result shouldBe ViewPortRange(40, 60)
  }

  test("subtract calculates the distinct new range across all overlap scenarios") {
    val scenarios = List(
      (ViewPortRange(0, 10), ViewPortRange(5, 15), ViewPortRange(10, 15)),
      (ViewPortRange(5, 15), ViewPortRange(0, 10), ViewPortRange(0, 5)),
      (ViewPortRange(5, 15), ViewPortRange(20, 30), ViewPortRange(20, 30)),
      (ViewPortRange(20, 30), ViewPortRange(0, 10), ViewPortRange(0, 10))
    )

    scenarios.foreach { case (firstRange, secondRange, expectedResult) =>
      withClue(s"Subtracting $secondRange from $firstRange:") {
        firstRange.subtract(secondRange) shouldBe expectedResult
      }
    }
  }

}