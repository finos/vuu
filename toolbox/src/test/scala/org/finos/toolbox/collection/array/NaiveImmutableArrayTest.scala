package org.finos.toolbox.collection.array

import org.finos.toolbox.time.{Clock, DefaultClock}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class NaiveImmutableArrayTest extends AnyFeatureSpec with Matchers {

  implicit val time: Clock = new DefaultClock

  Feature("check immutable array impl") {

    Scenario("Test set behaves as expected"){

      var array: ImmutableArray[String] = new NaiveImmutableArray(Array("Hello", "World"))

      array.map(f => f).toList should equal(List("Hello", "World"))

      array = array.set(0, "Goodbye")
      array.map(f => f).toList should equal(List("Goodbye", "World"))

      array = array.set(1, "Mikey")
      array.map(f => f).toList should equal(List("Goodbye", "Mikey"))
    }

    Scenario("Test remove behaves as expected"){

      var array: ImmutableArray[String] = new NaiveImmutableArray(Array("Goodbye", "Cruel", "World"))

      array.map(f => f).toList should equal(List("Goodbye", "Cruel", "World"))

      array = array.remove(0)
      array.map(f => f).toList should equal(List("Cruel", "World"))

      array = array.remove(1)
      array.map(f => f).toList should equal(List("Cruel"))
    }


  }
}
