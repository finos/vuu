package org.finos.vuu.plugin.virtualized.viewport

import org.finos.vuu.core.table.DataTable
import org.finos.vuu.provider.{Provider, VirtualizedProvider}
import org.finos.vuu.viewport.{ViewPort, ViewPortContainer}
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class VirtualizedViewPortWorkItemTest extends AnyFeatureSpec with Matchers with MockFactory {

  Feature("VirtualizedViewPortWorkItem Execution") {

    Scenario("WHEN the provider is a VirtualizedProvider THEN doWork should execute runOnce and return the viewport") {
      val mockViewPort = mock[ViewPort]
      val mockTable = mock[DataTable]
      val mockVirtualizedProvider = mock[VirtualizedProvider]

      (() => mockViewPort.table).expects().returning(mockTable)
      (() => mockTable.asTable).expects().returning(mockTable)
      (() => mockTable.getProvider).expects().returning(mockVirtualizedProvider)

      (mockVirtualizedProvider.runOnce _).expects(mockViewPort).once()

      val container: ViewPortContainer = null
      val workItem = VirtualizedViewPortWorkItem(mockViewPort, container)

      val result = workItem.doWork()

      result should equal(mockViewPort)
    }

    Scenario("WHEN the provider is NOT a VirtualizedProvider THEN doWork should skip execution and return the viewport safely") {
      val mockViewPort = mock[ViewPort]
      val mockTable = mock[DataTable]
      val mockStandardProvider = mock[Provider]

      (() => mockViewPort.table).expects().returning(mockTable)
      (() => mockTable.asTable).expects().returning(mockTable)
      (() => mockTable.getProvider).expects().returning(mockStandardProvider)

      val container: ViewPortContainer = null
      val workItem = VirtualizedViewPortWorkItem(mockViewPort, container)

      val result = workItem.doWork()

      result should equal(mockViewPort)
    }

    Scenario("WHEN checking standard object contracts THEN toString, hashCode, and equals should correctly proxy the viewport") {
      val mockViewPort = stub[ViewPort]

      val container: ViewPortContainer = null
      val workItem1 = VirtualizedViewPortWorkItem(mockViewPort, container)
      val workItem2 = VirtualizedViewPortWorkItem(mockViewPort, container)

      workItem1.hashCode() should equal(mockViewPort.hashCode())
      workItem1.toString should equal(s"Runner:[$mockViewPort]")

      workItem1.equals(workItem2) should equal(true)
    }
  }
}