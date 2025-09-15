package org.finos.vuu.core.table.datatype

import org.junit.Assert.assertEquals
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.finos.toolbox.time.TestFriendlyClock

import java.lang.System.currentTimeMillis
import java.time.Instant
import java.util.concurrent.TimeUnit

class EpochTimestampTest extends AnyFeatureSpec with Matchers {

  Feature("Check creation") {

    Scenario("Check creation via Instant") {

      val instant = Instant.ofEpochMilli(currentTimeMillis)

      val epochTimestamp = EpochTimestamp(instant)

      assertEquals(TimeUnit.MILLISECONDS.toNanos(instant.toEpochMilli), epochTimestamp.nanos)
    }

    Scenario("Check creation via Clock") {

      val clock = new TestFriendlyClock(currentTimeMillis)

      val epochTimestamp = EpochTimestamp(clock)

      assertEquals(TimeUnit.MILLISECONDS.toNanos(clock.now()), epochTimestamp.nanos)
    }

  }
}
