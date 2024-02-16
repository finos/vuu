package org.finos.vuu.example.rest.client

import io.vertx.core.Vertx
import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.example.rest.TestUtils.jsonArrayRegex
import org.finos.vuu.example.rest.demoserver.{DemoRestServer, DemoRestServerOptions}
import org.finos.vuu.example.rest.model.Instrument
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.Eventually
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.time.{Seconds, Span}

import scala.util.Try

class HttpClientTest extends AnyFeatureSpec with BeforeAndAfterAll with Matchers with Eventually {
  private final val PORT = 8091
  private final val HOST = "localhost"

  private val client = HttpClient(s"http://$HOST:$PORT")
  private val vertx = Vertx.vertx()

  override def beforeAll(): Unit = {
    val options = DemoRestServerOptions(PORT, HOST)
    vertx.deployVerticle(new DemoRestServer(options))
    eventually(timeout(Span(1, Seconds)))(vertx.deploymentIDs.size shouldEqual 1)
  }

  override def afterAll(): Unit = {
    vertx.close()
    eventually(timeout(Span(1, Seconds)))(vertx.deploymentIDs should have size 0)
  }

  Feature("client can connect to the demo-server") {
    Scenario("can return expected output when GET to a correct endpoint") {
      var res: Try[ClientResponse] = null

      client.get("/instruments?limit=3").apply {res = _}

      eventually(timeout(Span(2, Seconds)))(res.get.body should include regex jsonArrayRegex(3))
      JsonUtil.fromJson[List[Instrument]](res.get.body).head shouldBe a [Instrument]
    }

    Scenario("returns 404 when GET to a non-existent endpoint ") {
      var res: Try[ClientResponse] = null

      client.get("/hello-world").apply { res = _ }

      eventually(timeout(Span(2, Seconds)))(res.get.statusCode shouldEqual 404)
    }
  }
}
