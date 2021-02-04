package io.venuu.toolbox.collection.window

import org.scalatest.{FeatureSpec, Matchers}

class MovingWindowTest extends FeatureSpec with Matchers {

  feature("test windowed array") {

    scenario("check basic behaviour") {

      val window = new ArrayBackedMovingWindow[Array[AnyRef]](10)

      window.isWithinRange(0) should be(true)
      window.isWithinRange(1) should be(true)
      window.isWithinRange(9) should be(true)
      window.isWithinRange(10) should be(false)

      window.setAtIndex(0, Array("foo", "bar", "ping"))
      window.getAtIndex(0).get should equal(Array("foo", "bar", "ping"))

      window.getAtIndex(10) should equal(None)
    }

    scenario("test range setting"){

      val window = new ArrayBackedMovingWindow[Array[AnyRef]](10)

      window.setRange(10, 20)
      window.range.overlap(8, 18) should equal((10,18))
      window.range.overlap(20, 30) should equal((0,0))
      window.range.overlap(0, 8) should equal((0,0))
      window.range.overlap(0, 12) should equal((10,12))
    }

    scenario("test preserving data"){

      val window = new ArrayBackedMovingWindow[Array[AnyRef]](10)

      window.setAtIndex(1, Array("foo1", "bar", "ping"))

      window.setAtIndex(6, Array("foo6", "bar", "ping"))
      window.setAtIndex(7, Array("foo7", "bar", "ping"))
      window.setAtIndex(8, Array("foo8", "bar", "ping"))

      window.setRange(5, 15)

      window.getAtIndex(6).get should equal(Array("foo6", "bar", "ping"))
      window.getAtIndex(7).get should equal(Array("foo7", "bar", "ping"))
      window.getAtIndex(8).get should equal(Array("foo8", "bar", "ping"))
      window.getAtIndex(1) should equal(None)
      window.getAtIndex(10) should equal(None)
      window.isWithinRange(10) should equal(true)
    }

    scenario("test preserving data backwards"){

      val window = new ArrayBackedMovingWindow[Array[AnyRef]](10)

      window.setRange(20, 30)

      window.setAtIndex(20, Array("foo20", "bar", "ping"))

      window.setAtIndex(24, Array("foo24", "bar", "ping"))
      window.setAtIndex(25, Array("foo25", "bar", "ping"))
      window.setAtIndex(26, Array("foo26", "bar", "ping"))

      window.setRange(15, 26)

      window.getAtIndex(24).get should equal(Array("foo24", "bar", "ping"))
      window.getAtIndex(25).get should equal(Array("foo25", "bar", "ping"))
      window.getAtIndex(20).get should equal(Array("foo20", "bar", "ping"))
      window.getAtIndex(26) should equal(None)
      window.getAtIndex(1) should equal(None)
      window.getAtIndex(10) should equal(None)
      window.isWithinRange(25) should equal(true)
      window.isWithinRange(15) should equal(true)
    }
  }
}
