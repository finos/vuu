package io.venuu.toolbox.time

import org.scalatest.{FeatureSpec, Matchers}

/**
  * Created by chris on 25/07/2016.
  */
class TimeItTest extends FeatureSpec with Matchers {

  feature("Test TimeIt"){

    scenario("default usage"){

      import TimeIt._

      implicit val timeProvider = new TestFriendlyTimeProvider(100l)

      def aFunc(i: Int): Int = i * 2

      val (millis, ret) = timeIt{
        aFunc(10)
      }

      ret should equal(20)
    }

  }

}
