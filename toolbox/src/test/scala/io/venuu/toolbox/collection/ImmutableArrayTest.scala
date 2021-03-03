package io.venuu.toolbox.collection

import io.venuu.toolbox.collection.array.{ChunkedImmutableArray, ImmutableArray}
import io.venuu.toolbox.time.{Clock, DefaultClock, TimeIt}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers


/**
  * Created by chris on 22/12/2015.
  */
class ImmutableArrayTest extends AnyFeatureSpec with Matchers {

  implicit val time: Clock = new DefaultClock

  Feature("check immutable array impl"){

    Scenario("check array subtraction"){

      val a1 = ImmutableArray.from[String]( Array("1", "2", "3"))

      val a2 = a1.-("2")

      a2.toArray.sameElements((a1.-("2").iterator.toArray[String])) shouldBe(true)

      a2 shouldNot equal(a1)
    }

    Scenario("remove a value by index"){
      val a1 = ImmutableArray.from[String]( Array("1", "2", "3"))

      val a2 = a1.remove(1)

      a2.toArray.sameElements(a1.-("2").iterator.toArray[String]) shouldBe(true)

    }

    Scenario("build very big immutable array and then remove an item"){

      val numbers = (0 to 100000).toArray

      val immute = ImmutableArray.from[Int](numbers)

      val (millis, _ ) = TimeIt.timeIt{
        (0 to 1000).foreach( i => immute.-(i))
      }

      println(s"$millis to remove 1000 items")
    }


//    Scenario("add items one by one for a hundred thousand items"){
//
//      var array = ImmutableArray.empty[String]
//
//      val (millis, _ ) = TimeIt.timeIt{
//
//        val numbers = (0 to 1_000_000).foreach( i=> {
//          array = array.+(i.toString)
//        })
//      }
//      println(s"$millis millis to add 100,000 items")
//    }
  }
}
