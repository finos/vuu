package org.finos.toolbox.time

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DateTimeSchedulerTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  Feature("check date time scheduler"){

    Scenario("test parsing"){

      Given("this time 20th/Oct/2016 at 10:14am")
      implicit val time = new TestFriendlyClock(1476951221856L)

      val scheduler = new DateTimeScheduler("Mo Tu We", List("09:00:01", "15:00:00"), "Europe/London")

      And("we ask for the next scheduled time")
      val next = scheduler.next()


      Then("it should be 09:00:01 on Monday 24th Oct 2017")



    }

  }

}
