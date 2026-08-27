package org.finos.vuu.wsapi

import com.typesafe.scalalogging.LazyLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.VuuServerConfig
import org.finos.vuu.core.module.{TableDefContainer, ViewServerModule}
import org.finos.vuu.net.*
import org.finos.vuu.net.row.RowUpdateType.Update
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
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
    timeProvider = new DefaultClock
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

  def waitForData(viewPortId: String, count: Int): Unit = {
    waitForData(Map(viewPortId -> count))
  }

  def createViewPortAndVerifyDataSize(
                                       tableName: String,
                                       moduleName: String,
                                       expectedRowCount: Int): String = {
    createViewPortAndVerifyDataSize(tableName, moduleName, Array("*"), expectedRowCount)
  }

  def createViewPortAndVerifyDataSize(
                                       tableName: String,
                                       moduleName: String,
                                       columns: Array[String],
                                       expectedRowCount: Int): String = {
    val createViewPortRequest = CreateViewPortRequest(ViewPortTable(tableName, moduleName), ViewPortRange(0, 100), columns = columns)
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(viewPortId, expectedRowCount)
    viewPortId
  }

  @tailrec
  final def waitForData(expectations: Map[String, Int]): Unit = {
    val tableRowUpdatesResponse = vuuClient.awaitForMsgWithBody[TableRowUpdates]
    tableRowUpdatesResponse match {
      case None => fail("No table row updates")
      case Some(value) =>
        val rows = tableRowUpdatesResponse.get.rows

        val updatedExpectations = expectations.map { case (vpId, expectedSize) =>
          val updateCount = rows.count(p => p.viewPortId == vpId && p.updateType == Update)
          logger.debug(s"Viewport $vpId has received $updateCount updates")
          vpId -> (expectedSize - updateCount)
        }.filter { case (_, remainingSize) => remainingSize > 0 }

        if (updatedExpectations.nonEmpty) {
          logger.debug(updatedExpectations.map { case (vpId, remaining) =>
            s"Viewport $vpId still needs $remaining more updates"
          }.mkString(", "))
          waitForData(updatedExpectations)
        }
    }

  }

}

