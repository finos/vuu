package org.finos.vuu.example.rest

import cats.effect
import cats.effect.IO
import cats.effect.unsafe.implicits.global
import org.finos.vuu.example.rest.demoserver.DemoRestServer
import org.scalatest.BeforeAndAfterAll
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RestClientTest extends AnyFeatureSpec with BeforeAndAfterAll with Matchers {

  private val client = RestClient("http://localhost:8091")

  var fiber: effect.FiberIO[Nothing] = _
  override def beforeAll(): Unit = {
    fiber = DemoRestServer.server(8091).resource.use(_ => IO.never).start.unsafeRunSync()
  }
  override def afterAll(): Unit = fiber.cancel.unsafeRunSync()

  Feature("client can connect to the demo-server") {
    Scenario("getInstruments return expected output") {
      client.getInstruments.length should be > 10
    }
  }
}
