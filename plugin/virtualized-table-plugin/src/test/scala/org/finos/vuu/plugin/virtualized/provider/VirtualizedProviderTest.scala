package org.finos.vuu.plugin.virtualized.provider

import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.plugin.virtualized.table.VirtualizedSessionTable
import org.finos.vuu.viewport.{ViewPort, ViewPortRange}
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.*
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

import java.time.Duration

class VirtualizedProviderTest
  extends AnyFeatureSpec
    with GivenWhenThen
    with Matchers
    with MockitoSugar {

  given clock: Clock = new TestFriendlyClock(0)

  Feature("VirtualizedProvider execution based on viewport and table refresh status") {

    Scenario("runOnce executes refreshSessionTable and finishes refresh when table needs refresh") {
      Given("a provider and a viewport requiring refresh")
      val provider = spy(new TestVirtualizedProvider)
      val (viewport, virtualizedTable) = setupVirtualizedViewport(
        needsRefresh = true,
        hashCode = 1,
        range = ViewPortRange(0, 10),
        refreshRate = Duration.ofMillis(250)
      )

      When("runOnce is executed for the viewport")
      provider.runOnce(viewport)

      Then("refreshSessionTable should be called for the viewport and table")
      verify(provider).refreshSessionTable(viewport, virtualizedTable)

      And("finishRefresh should be updated with the expected refresh timestamp")
      verify(virtualizedTable).finishRefresh(1, ViewPortRange(0, 10), 250)
    }

    Scenario("runOnce skips refresh when table does not need refresh") {
      Given("a provider and a viewport that does NOT need refresh")
      val provider = spy(new TestVirtualizedProvider)
      val (viewport, _) = setupVirtualizedViewport(needsRefresh = false)

      When("runOnce is executed for the viewport")
      provider.runOnce(viewport)

      Then("refreshSessionTable should NOT be invoked")
      verify(provider, never()).refreshSessionTable(any(), any())
    }

    Scenario("runOnce skips refresh when table is not a VirtualizedSessionTable") {
      Given("a provider and a viewport linked to a standard non-virtualized table")
      val provider = spy(new TestVirtualizedProvider)
      val viewport = setupNonVirtualizedViewport()

      When("runOnce is executed for the viewport")
      provider.runOnce(viewport)

      Then("refreshSessionTable should NOT be invoked")
      verify(provider, never()).refreshSessionTable(any(), any())
    }
  }

  // --- Helpers & Test Doubles ---

  private def setupVirtualizedViewport(
                                        needsRefresh: Boolean,
                                        hashCode: Int = 1,
                                        range: ViewPortRange = ViewPortRange(0, 10),
                                        refreshRate: Duration = Duration.ofMillis(250)
                                      ): (ViewPort, VirtualizedSessionTable) = {
    val mockViewport = mock[ViewPort]
    val mockSession = mock[ClientSessionId]
    val mockDataTable = mock[DataTable]
    val mockVirtualizedTable = mock[VirtualizedSessionTable]
    val mockTableDef = mock[VirtualizedSessionTableDef]

    when(mockViewport.id).thenReturn("vp-123")
    when(mockViewport.session).thenReturn(mockSession)
    when(mockSession.sessionId).thenReturn("session-456")

    when(mockViewport.getStructuralHashCode()).thenReturn(hashCode)
    when(mockViewport.getRange).thenReturn(range)

    when(mockViewport.table).thenReturn(mockDataTable)
    when(mockDataTable.asTable).thenReturn(mockVirtualizedTable)

    when(mockVirtualizedTable.needsRefresh(mockViewport)).thenReturn(needsRefresh)
    when(mockVirtualizedTable.getTableDef).thenReturn(mockTableDef)
    when(mockTableDef.getRefreshRateMillis).thenReturn(refreshRate.toMillis)

    (mockViewport, mockVirtualizedTable)
  }

  private def setupNonVirtualizedViewport(): ViewPort = {
    val mockViewport = mock[ViewPort]
    val mockSession = mock[ClientSessionId]
    val mockDataTable = mock[DataTable]
    val mockStandardTable = mock[DataTable]

    when(mockViewport.id).thenReturn("vp-789")
    when(mockViewport.session).thenReturn(mockSession)
    when(mockSession.sessionId).thenReturn("session-101")

    when(mockViewport.table).thenReturn(mockDataTable)
    when(mockDataTable.asTable).thenReturn(mockStandardTable)

    mockViewport
  }
}

/** Stub class extending VirtualizedProvider to avoid stubbing required
 * abstract methods inside test bodies.
 */
private class TestVirtualizedProvider(using clock: Clock) extends VirtualizedProvider {
  override def refreshSessionTable(
                                    viewPort: ViewPort,
                                    table: VirtualizedSessionTable
                                  ): Unit = ()

  override def getUniqueValuesVPColumn(
                                        columnName: String,
                                        viewPort: ViewPort
                                      ): Array[String] = ???

  override def getUniqueValuesStartingWithVPColumn(
                                                    columnName: String,
                                                    starts: String,
                                                    viewPort: ViewPort
                                                  ): Array[String] = ???

  override def subscribe(key: String): Unit = ???

  override def doStart(): Unit = ???

  override def doStop(): Unit = ???

  override def doInitialize(): Unit = ???

  override def doDestroy(): Unit = ???

  override val lifecycleId: String = "TestVirtualizedProvider"
}