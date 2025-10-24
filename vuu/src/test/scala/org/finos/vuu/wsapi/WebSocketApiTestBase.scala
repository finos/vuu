package org.finos.vuu.wsapi

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.net._
import org.finos.vuu.wsapi.helpers.{TestStartUp, TestVuuClient}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.{BeforeAndAfterAll, GivenWhenThen}

abstract class WebSocketApiTestBase extends AnyFeatureSpec with BeforeAndAfterAll with GivenWhenThen with Matchers {

  implicit var timeProvider: Clock = _
  implicit var lifecycle: LifecycleContainer = _
  implicit var tableDefContainer: TableDefContainer = _
  var viewServerClient: ViewServerClient = _
  var vuuClient: TestVuuClient = _
  var tokenId: String = _
  var sessionId: String = _

  override def beforeAll(): Unit = {
    timeProvider =  new DefaultClock
    lifecycle = new LifecycleContainer
    tableDefContainer = new TableDefContainer

    vuuClient = testStartUp()
    
    val sessionOption = vuuClient.login("testUser")
    assert(sessionOption.isDefined)
    sessionId = sessionOption.get
  }

  override def afterAll(): Unit = {
    lifecycle.stop()
  }

  def testStartUp(): TestVuuClient = {
    val startUp = new TestStartUp(() => defineModuleWithTestTables())
    startUp.startServerAndClient()
  }

  protected def defineModuleWithTestTables(): ViewServerModule

  protected def assertBodyIsInstanceOf[BodyType](response: Option[ViewServerMessage]): BodyType = {
    response.isDefined shouldBe true
    assertAndCastAsInstanceOf(response.get.body)
  }

  def assertAndCastAsInstanceOf[T](data: Any): T = {
    assert(data.isInstanceOf[T])
    data.asInstanceOf[T]
  }


}

