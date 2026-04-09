package org.finos.vuu.wsapi

import com.typesafe.scalalogging.LazyLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.VuuServerConfig
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.net.*
import org.finos.vuu.net.row.RowUpdateType.Update
import org.finos.vuu.wsapi.helpers.{TestStartUp, TestVuuClient}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.{BeforeAndAfterAll, BeforeAndAfterEach, GivenWhenThen}

import scala.annotation.tailrec
import scala.reflect.ClassTag

abstract class WebSocketApiTestBase extends AnyFeatureSpec with BeforeAndAfterAll with BeforeAndAfterEach
  with GivenWhenThen with Matchers with LazyLogging {

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

  protected def assertBodyIsInstanceOf[BodyType: ClassTag](response: Option[ViewServerMessage]): BodyType = {
    response.isDefined shouldBe true
    assertAndCastAsInstanceOf[BodyType](response.get.body)
  }

  def assertAndCastAsInstanceOf[T: ClassTag](data: Any): T = {
    val tag = implicitly[ClassTag[T]]
    assert(tag.runtimeClass.isInstance(data))
    data.asInstanceOf[T]
  }

  @tailrec
  protected final def waitForData(expectedRowCount: Int): Unit = {
    val tableSizeResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
    tableSizeResponse match {
      case None => fail("No table row updates")
      case Some(value) =>
        val dataCount = value.rows.count(p => p.updateType == Update)
        if (dataCount < expectedRowCount) {
          val missing = expectedRowCount - dataCount
          logger.debug(s"Still waiting for $missing rows")
          waitForData(expectedRowCount - dataCount)
        }
    }
  }

}

