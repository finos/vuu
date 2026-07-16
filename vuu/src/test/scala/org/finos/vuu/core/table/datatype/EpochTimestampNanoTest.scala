package org.finos.vuu.core.table.datatype

import org.finos.toolbox.time.TestFriendlyClock
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks

import java.lang.System.currentTimeMillis
import java.time.{Duration, Instant, ZoneId, ZonedDateTime}

class EpochTimestampNanoTest extends AnyFeatureSpec with Matchers with TableDrivenPropertyChecks {

  Feature("Check creation") {

    Scenario("Check default creation") {

      val nanos = Duration.ofMillis(currentTimeMillis).toNanos

      val epochTimestamp = EpochTimestampNano()

      epochTimestamp.nanos should be (nanos +- Duration.ofMillis(100).toNanos)
    }

    Scenario("Check creation via Instant") {

      val millis = currentTimeMillis
      val instant = Instant.ofEpochMilli(millis)

      val epochTimestamp = EpochTimestampNano(instant)

      epochTimestamp.nanos shouldEqual Duration.ofMillis(millis).toNanos
    }

    Scenario("Check creation via Clock") {

      val millis = currentTimeMillis
      val clock = new TestFriendlyClock(millis)

      val epochTimestamp = EpochTimestampNano(clock)

      epochTimestamp.nanos shouldEqual Duration.ofMillis(millis).toNanos
    }

    Scenario("Check creation via ZonedDateTime") {
      val millis = currentTimeMillis
      val zonedDateTime = ZonedDateTime.ofInstant(Instant.ofEpochMilli(millis), ZoneId.of("UTC"))

      val epochTimestamp = EpochTimestampNano(zonedDateTime)

      epochTimestamp.nanos shouldEqual Duration.ofMillis(millis).toNanos
    }

  }

  Feature("Other") {

    Scenario("To String matches Long") {

      val nanos = System.nanoTime()
      val epochTimestamp = EpochTimestampNano(nanos)

      epochTimestamp.toString.toLong shouldEqual nanos
    }

    Scenario("Comparing EpochTimestampNano instances") {
      val comparisonTable = Table(
        ("val1", "val2", "isGreater", "isEqual"),
        (1000L, 2000L, false, false),
        (2000L, 1000L, true, false),
        (1000L, 1000L, false, true)
      )

      forAll(comparisonTable) { (v1, v2, isGreater, isEqual) =>
        val sd1 = EpochTimestampNano(v1)
        val sd2 = EpochTimestampNano(v2)

        (sd1 > sd2) shouldBe isGreater
        (sd1 == sd2) shouldBe isEqual
        if (!isEqual) (sd1 < sd2) shouldBe !isGreater
      }
    }

  }

}