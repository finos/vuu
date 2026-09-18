package org.finos.vuu.net.rest

import org.finos.vuu.net.rest.*
import org.mockito.Mockito.{times, verify}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar.mock

class RestServiceTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

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

      When("calling all default handler methods")
      service.onGetAll(mockContext)
      service.onGet(mockContext)
      service.onPost(mockContext)
      service.onPut(mockContext)
      service.onDelete(mockContext)

      Then("the mock verifies that respond(404) was called for each")
      verify(mockContext, times(5)).respond(404)
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

      When("onGet is called")
      customService.onGet(mockContext)

      Then("the custom response logic is executed")
      verify(mockContext).respond(200, "Found it", StringEncoder)
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