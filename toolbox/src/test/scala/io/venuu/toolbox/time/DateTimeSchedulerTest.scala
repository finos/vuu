/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 20/10/2016.
  *
  */
package io.venuu.toolbox.time

import org.scalatest.{FeatureSpec, GivenWhenThen, Matchers}

class DateTimeSchedulerTest extends FeatureSpec with Matchers with GivenWhenThen{

  feature("check date time scheduler"){

    scenario("test parsing"){

      Given("this time 20th/Oct/2016 at 10:14am")
      implicit val time = new TestFriendlyClock(1476951221856l)

      val scheduler = new DateTimeScheduler("Mo Tu We", List("09:00:01", "15:00:00"), "Europe/London")

      And("we ask for the next scheduled time")
      val next = scheduler.next()


      Then("it should be 09:00:01 on Monday 24th Oct 2017")



    }

  }

}
