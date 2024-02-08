package org.finos.vuu.example.ignite.query

import org.finos.vuu.viewport.ViewPortRange
import org.scalatest.funsuite.AnyFunSuiteLike
import org.scalatest.matchers.should.Matchers

class CalcIndexTest extends AnyFunSuiteLike with Matchers {

  test("Get index given view port range is at start") {
    val (starIndex, endIndex, rowCount) =
      IndexCalculator(extraRowsCount = 10)
        .calc(ViewPortRange(from = 0, to = 100), totalSize = 1000)

    starIndex shouldEqual 0
    endIndex shouldEqual 110
    rowCount shouldEqual 110
  }

  test("Get index given view port range is at middle") {
    val (starIndex, endIndex, rowCount) =
      IndexCalculator(extraRowsCount = 10)
        .calc(ViewPortRange(from = 100, to = 200), totalSize = 1000)

    starIndex shouldEqual 90
    endIndex shouldEqual 210
    rowCount shouldEqual 120
  }

  test("Get index given view port range is at end") {
    val (starIndex, endIndex, rowCount) =
      IndexCalculator(extraRowsCount = 10)
        .calc(ViewPortRange(from = 900, to = 1000), totalSize = 1000)

    starIndex shouldEqual 890
    endIndex shouldEqual 1000
    rowCount shouldEqual 110
  }

  test("Get single row given view port range of one") {
    val (starIndex, endIndex, rowCount) =
      IndexCalculator(extraRowsCount = 0)
        .calc(ViewPortRange(from = 5, to = 5), totalSize = 1000)

    starIndex shouldEqual 5
    endIndex shouldEqual 5
    rowCount shouldEqual 1
  }

  test("Get zero rows given view port range or zero") {
    val (starIndex, endIndex, rowCount) =
      IndexCalculator(extraRowsCount = 0)
        .calc(ViewPortRange(from = 0, to = 0), totalSize = 1000)

    starIndex shouldEqual 0
    endIndex shouldEqual 0
    rowCount shouldEqual 0
  }
}
