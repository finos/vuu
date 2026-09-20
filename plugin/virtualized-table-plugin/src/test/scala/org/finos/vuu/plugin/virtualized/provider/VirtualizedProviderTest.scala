package org.finos.vuu.plugin.virtualized.provider

import org.finos.vuu.core.table.DataTable
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.virtualized.table.VirtualizedSessionTable
import org.finos.vuu.viewport.ViewPort
import org.mockito.Mockito.*
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

class VirtualizedProviderTest
  extends AnyFeatureSpec
    with GivenWhenThen
    with Matchers
    with MockitoSugar {

  Feature("VirtualizedProvider execution based on viewport and table refresh status") {

    Scenario("runOnce executes runOnceInternal when table needs refresh") {
      Given("an anonymous VirtualizedProvider instance tracking runOnceInternal calls")
      var internalCallCount = 0
      var capturedViewport: ViewPort = null

      val provider = new DummyVirtualizedProvider {
        override def runOnceInternal(viewPort: ViewPort): Unit = {
          internalCallCount += 1
          capturedViewport = viewPort
        }
      }

      And("a ViewPort linked to a VirtualizedSessionTable requiring refresh")
      val mockViewport = mock[ViewPort]
      val mockSession = mock[ClientSessionId]
      val mockTable = mock[DataTable]
      val mockVirtualizedTable = mock[VirtualizedSessionTable]

      when(mockViewport.id).thenReturn("vp-123")
      when(mockViewport.session).thenReturn(mockSession)
      when(mockSession.sessionId).thenReturn("session-456")
      when(mockViewport.table).thenReturn(mockTable)
      when(mockTable.asTable).thenReturn(mockVirtualizedTable)
      when(mockVirtualizedTable.needsRefresh(mockViewport)).thenReturn(true)

      When("runOnce is executed for the viewport")
      provider.runOnce(mockViewport)

      Then("runOnceInternal should be invoked exactly once with the expected viewport")
      internalCallCount shouldBe 1
      capturedViewport shouldBe mockViewport
    }

    Scenario("runOnce skips runOnceInternal when table does not need refresh") {
      Given("an anonymous VirtualizedProvider instance")
      var internalCallCount = 0

      val provider = new DummyVirtualizedProvider {
        override def runOnceInternal(viewPort: ViewPort): Unit = {
          internalCallCount += 1
        }
      }

      And("a ViewPort linked to a VirtualizedSessionTable NOT requiring refresh")
      val mockViewport = mock[ViewPort]
      val mockSession = mock[ClientSessionId]
      val mockTable = mock[DataTable]
      val mockVirtualizedTable = mock[VirtualizedSessionTable]

      when(mockViewport.id).thenReturn("vp-123")
      when(mockViewport.session).thenReturn(mockSession)
      when(mockSession.sessionId).thenReturn("session-456")
      when(mockViewport.table).thenReturn(mockTable)
      when(mockTable.asTable).thenReturn(mockVirtualizedTable)
      when(mockVirtualizedTable.needsRefresh(mockViewport)).thenReturn(false)

      When("runOnce is executed for the viewport")
      provider.runOnce(mockViewport)

      Then("runOnceInternal should NOT be invoked")
      internalCallCount shouldBe 0
    }

    Scenario("runOnce skips runOnceInternal when table is not a VirtualizedSessionTable") {
      Given("an anonymous VirtualizedProvider instance")
      var internalCallCount = 0

      val provider = new DummyVirtualizedProvider {
        override def runOnceInternal(viewPort: ViewPort): Unit = {
          internalCallCount += 1
        }
      }

      And("a ViewPort linked to a non-virtualized table")
      val mockViewport = mock[ViewPort]
      val mockSession = mock[ClientSessionId]
      val mockTable = mock[DataTable]
      val mockStandardTable = mock[DataTable]

      when(mockViewport.id).thenReturn("vp-789")
      when(mockViewport.session).thenReturn(mockSession)
      when(mockSession.sessionId).thenReturn("session-101")
      when(mockViewport.table).thenReturn(mockTable)
      when(mockTable.asTable).thenReturn(mockStandardTable)

      When("runOnce is executed for the viewport")
      provider.runOnce(mockViewport)

      Then("runOnceInternal should NOT be invoked")
      internalCallCount shouldBe 0
    }
  }

}

private trait DummyVirtualizedProvider extends VirtualizedProvider {

  override def getUniqueValuesVPColumn(columnName: String, viewPort: ViewPort): Array[String] = ???

  override def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPort: ViewPort): Array[String] = ???

  override def subscribe(key: String): Unit = ???

  override def doStart(): Unit = ???

  override def doStop(): Unit = ???

  override def doInitialize(): Unit = ???

  override def doDestroy(): Unit = ???

  override val lifecycleId: String = s"DummyVirtualizedProvider$hashCode()"
}