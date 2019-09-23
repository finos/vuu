package io.venuu.toolbox.collection

import io.venuu.toolbox.ImmutableArray
import io.venuu.toolbox.time.{DefaultTimeProvider, TimeIt, TimeProvider}
import org.scalatest.{FeatureSpec, Matchers}

/**
  * Created by chris on 22/12/2015.
  */
class ImmutableArrayTest extends FeatureSpec with Matchers {

  implicit val time: TimeProvider = new DefaultTimeProvider

  feature("check immutable array impl"){

    scenario("check array subtraction"){

      val a1 = ImmutableArray.from[String]( Array("1", "2", "3"))

      val a2 = a1.-("2")

      a2 should equal(a1.-("2"))

      a2 should not equal(a1)
    }

    scenario("remove a value by index"){
      val a1 = ImmutableArray.from[String]( Array("1", "2", "3"))

      val a2 = a1.remove(1)

      a2 should equal(a1.-("2"))

    }

    scenario("build very big immutable array and then remove an item"){

      val numbers = (0 to 100000) toArray

      val immute = ImmutableArray.from[Int](numbers)

      val (millis, _ ) = TimeIt.timeIt{
        (0 to 1000).foreach( i => immute.-(i))
      }

      println(s"$millis to remove 1000 items")
    }
  }
}
