package org.finos.vuu.core.table

import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers

class RangeSettingsTest extends AnyFunSuite with Matchers {

  test("RangeSettings.apply creates default settings") {
    val settings = RangeSettings()

    settings.maxRangeEnd shouldBe Int.MaxValue
    settings.maxRangeWidth shouldBe 1000
  }

  test("withMaxRangeEnd returns new instance with updated maxRangeEnd") {
    val initial = RangeSettings()
    val updated = initial.withMaxRangeEnd(500)

    updated.maxRangeEnd shouldBe 500
    updated.maxRangeWidth shouldBe initial.maxRangeWidth

    // Ensure original instance remains untouched (immutability)
    initial.maxRangeEnd shouldBe Int.MaxValue
  }

  test("withMaxRangeWidth returns new instance with updated maxRangeWidth") {
    val initial = RangeSettings()
    val updated = initial.withMaxRangeWidth(250)

    updated.maxRangeWidth shouldBe 250
    updated.maxRangeEnd shouldBe initial.maxRangeEnd

    // Ensure original instance remains untouched (immutability)
    initial.maxRangeWidth shouldBe 1000
  }

  test("chaining wither methods applies all updates correctly") {
    val settings = RangeSettings()
      .withMaxRangeEnd(2_000)
      .withMaxRangeWidth(100)

    settings.maxRangeEnd shouldBe 2_000
    settings.maxRangeWidth shouldBe 100
  }
}
