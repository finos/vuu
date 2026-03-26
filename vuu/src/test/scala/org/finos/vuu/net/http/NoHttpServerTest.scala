package org.finos.vuu.net.http

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class NoHttpServerTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("NoHttpServer lifecycle management") {

    Scenario("The NoHttpServer should identify itself and handle lifecycle transitions") {

      Given("a NoHttpServer instance")
      val server = NoHttpServer

      When("the lifecycle ID is checked")
      val id = server.lifecycleId

      Then("it should return 'NoHttpServer'")
      id shouldBe "NoHttpServer"

      And("calling lifecycle methods should not throw any exceptions")
      noException should be thrownBy {
        server.doInitialize()
        server.doStart()
        server.doStop()
        server.doDestroy()
      }
    }
  }
}
