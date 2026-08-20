package org.finos.toolbox.time

import org.finos.toolbox.time.TimeUtils.ofEpochNanosecond
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class TimeUtilsTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Test epoch nano conversion") {

    Scenario("Long to Instant") {
      val result = ofEpochNanosecond(1_000_000)

      result shouldEqual java.time.Instant.ofEpochMilli(1)
    }

  }

}
