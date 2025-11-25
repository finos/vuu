package org.finos.vuu.core.table.datatype

import org.finos.toolbox.time.TestFriendlyClock
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.lang.System.currentTimeMillis
import java.time.Instant

class EpochTimestampTest extends AnyFeatureSpec with Matchers {

  Feature("Check creation") {

    Scenario("Check default creation") {

      val millis = currentTimeMillis

      val epochTimestamp = EpochTimestamp()

      epochTimestamp.millis should be (millis +- 100)

    }

    Scenario("Check creation via Instant") {

      val millis = currentTimeMillis
      val instant = Instant.ofEpochMilli(millis)

      val epochTimestamp = EpochTimestamp(instant)

      epochTimestamp.millis shouldEqual millis

    }

    Scenario("Check creation via Clock") {

      val millis = currentTimeMillis
      val clock = new TestFriendlyClock(millis)

      val epochTimestamp = EpochTimestamp(clock)

      epochTimestamp.millis shouldEqual millis

    }

  }

  Feature("Other") {

    Scenario("To String matches Long") {

      val millis = currentTimeMillis
      val epochTimestamp = EpochTimestamp(millis)

      epochTimestamp.toString.toLong shouldEqual millis
    }


  }

}