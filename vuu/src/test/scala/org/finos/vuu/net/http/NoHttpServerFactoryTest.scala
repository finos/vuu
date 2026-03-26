package org.finos.vuu.net.http

import org.finos.vuu.net.rest.RestService
import org.scalamock.scalatest.MockFactory
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class NoHttpServerFactoryTest extends AnyFeatureSpec with Matchers with GivenWhenThen with MockFactory {

  Feature("NoHttpServerFactory server creation") {

    Scenario("The factory should return NoHttpServer regardless of the services provided") {

      Given("a list of mock REST services")
      val mockServices = List(mock[RestService], mock[RestService])
      val factory = NoHttpServerFactory

      When("the factory creates a server")
      val result = factory.create(mockServices)

      Then("the returned server should be the NoHttpServer instance")
      result shouldBe NoHttpServer

      And("it should specifically be a type of HttpServer")
      result shouldBe a [HttpServer]
    }

    Scenario("The factory should handle an empty list of services") {

      Given("an empty list of services")
      val emptyServices = Nil

      When("the factory creates a server")
      val result = NoHttpServerFactory.create(emptyServices)

      Then("it should still return the NoHttpServer singleton")
      result shouldBe NoHttpServer
    }
  }
}
