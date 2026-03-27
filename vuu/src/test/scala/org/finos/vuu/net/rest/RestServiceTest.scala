package org.finos.vuu.net.rest

import org.finos.vuu.net.rest.*
import org.scalamock.scalatest.MockFactory
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RestServiceTest extends AnyFeatureSpec with Matchers with GivenWhenThen with MockFactory {

  Feature("RestService default behavior") {

    Scenario("The service should return correct URI paths") {
      Given("a concrete TestRestService")
      val service = new TestRestService()

      Then("all URI getter methods should return the expected strings")
      service.getServiceName shouldBe "TestService"
      service.getUriGetAll shouldBe "/api/test"
    }

    Scenario("Default 'onX' methods should respond with 404") {
      Given("a TestRestService and a mocked RestContext")
      val service = new TestRestService()
      val mockContext = mock[RestContext]

      And("we expect the context to receive a 404 response call")
      mockContext.respond.expects(404).repeated(5)

      When("calling all default handler methods")
      service.onGetAll(mockContext)
      service.onGet(mockContext)
      service.onPost(mockContext)
      service.onPut(mockContext)
      service.onDelete(mockContext)

      Then("the mock verifies that respond(404) was called for each")
    }
  }

  Feature("Overriding default behavior") {
    Scenario("An overridden method should provide custom logic") {

      Given("a RestService that overrides onGet")
      val customService = new TestRestService {
        override def onGet(context: RestContext): Unit = {
          context.respond(200, "Found It", StringEncoder)
        }
      }
      val mockContext = mock[RestContext]

      And("we expect a 200 OK response instead of 404")
      (mockContext.respond[String] _).expects(200, "Found It", StringEncoder, *, *).once()

      When("onGet is called")
      customService.onGet(mockContext)

      Then("the custom response logic is executed")
    }
  }
}

private class TestRestService extends RestService {
  override def getServiceName: String = "TestService"
  override def getUriGetAll: String   = "/api/test"
  override def getUriGet: String      = "/api/test/:id"
  override def getUriPost: String     = "/api/test"
  override def getUriDelete: String   = "/api/test/:id"
  override def getUriPut: String      = "/api/test/:id"
}