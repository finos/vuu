package org.finos.vuu.core.table.datatype

import org.finos.toolbox.time.TestFriendlyClock
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks

import java.lang.System.currentTimeMillis
import java.time.Instant

class EpochTimestampTest extends AnyFeatureSpec with Matchers with TableDrivenPropertyChecks {

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

    Scenario("Comparing EpochTimestamp instances") {
      val comparisonTable = Table(
        ("val1", "val2", "isGreater", "isEqual"),
        (1000L, 2000L, false, false),
        (2000L, 1000L, true, false),
        (1000L, 1000L, false, true)
      )

      forAll(comparisonTable) { (v1, v2, isGreater, isEqual) =>
        val sd1 = EpochTimestamp(v1)
        val sd2 = EpochTimestamp(v2)

        (sd1 > sd2) shouldBe isGreater
        (sd1 == sd2) shouldBe isEqual
        if (!isEqual) (sd1 < sd2) shouldBe !isGreater
      }
    }

  }

}