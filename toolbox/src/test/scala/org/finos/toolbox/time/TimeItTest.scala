package org.finos.toolbox.time

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class TimeItTest extends AnyFeatureSpec with Matchers {

  Feature("Test TimeIt"){

    Scenario("default usage"){

      import TimeIt._

      implicit val timeProvider = new TestFriendlyClock(100L)

      def aFunc(i: Int): Int = i * 2

      val (millis, ret) = timeIt{
        aFunc(10)
      }

      ret should equal(20)
    }

  }

}
