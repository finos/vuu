package org.finos.vuu.wsapi

import com.typesafe.scalalogging.LazyLogging
import org.awaitility.scala.AwaitilitySupport
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.VuuServerConfig
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.net.*
import org.finos.vuu.wsapi.helpers.{TestStartUp, TestVuuClient}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.{BeforeAndAfterAll, BeforeAndAfterEach, GivenWhenThen}

import scala.annotation.tailrec

abstract class WebSocketApiTestBase extends AnyFeatureSpec with BeforeAndAfterAll with BeforeAndAfterEach
  with GivenWhenThen with AwaitilitySupport with Matchers with LazyLogging {

  implicit var timeProvider: Clock = _
  implicit var lifecycle: LifecycleContainer = _
  implicit var tableDefContainer: TableDefContainer = _
  var vuuServerConfig: VuuServerConfig = _
  var viewServerClient: ViewServerClient = _
  var vuuClient: TestVuuClient = _
  var sessionId: String = _

  override def beforeAll(): Unit = {
    timeProvider =  new DefaultClock
    lifecycle = new LifecycleContainer
    tableDefContainer = new TableDefContainer

    val startUp = testStartUp()
    vuuClient = startUp._1
    vuuServerConfig = startUp._2
    
    val sessionOption = vuuClient.login("testUser")
    assert(sessionOption.isDefined)
    sessionId = sessionOption.get
  }

  override def afterAll(): Unit = {
    lifecycle.stop()
  }

  def testStartUp(): (TestVuuClient, VuuServerConfig) = {
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

  @tailrec
  protected final def waitForData(expectedRowCount: Int): Unit = {
    val tableSizeResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
    tableSizeResponse match {
      case None => fail("No table row updates")
      case Some(value) =>
        val dataCount = value.rows.count(p => p.updateType == "U")
        if (dataCount < expectedRowCount) {
          val missing = expectedRowCount - dataCount
          logger.debug(s"Still waiting for $missing rows")
          waitForData(expectedRowCount - dataCount)
        }
    }
  }

}

