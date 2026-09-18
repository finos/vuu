package org.finos.vuu.plugin.virtualized.viewport

import org.finos.vuu.core.table.DataTable
import org.finos.vuu.provider.{Provider, VirtualizedProvider}
import org.finos.vuu.viewport.ViewPort
import org.mockito.Mockito.{verify, when}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

import java.util.concurrent.{ExecutionException, FutureTask}

class VirtualizedViewPortCallableTest extends AnyFeatureSpec with Matchers with MockitoSugar {

  Feature("VirtualizedViewPortCallable Execution") {

    Scenario("WHEN the provider is a VirtualizedProvider THEN it should execute runOnce and return the viewport") {
      val mockViewPort = mock[ViewPort]
      val mockTable = mock[DataTable]
      val mockVirtualizedProvider = mock[VirtualizedProvider]
      when(mockViewPort.table).thenReturn(mockTable)
      when(mockTable.asTable).thenReturn(mockTable)
      when(mockTable.getProvider).thenReturn(mockVirtualizedProvider)
      val futureTask = new FutureTask[ViewPort](() => mockViewPort)
      futureTask.run()
      val callable = VirtualizedViewPortCallable(futureTask, null)

      val result = callable.call()

      result should equal(mockViewPort)
      verify(mockVirtualizedProvider).runOnce(mockViewPort)
    }

    Scenario("WHEN the provider is NOT a VirtualizedProvider THEN it should skip execution and return the viewport safely") {
      val mockViewPort = mock[ViewPort]
      val mockTable = mock[DataTable]
      val mockStandardProvider = mock[Provider]
      when(mockViewPort.table).thenReturn(mockTable)
      when(mockTable.asTable).thenReturn(mockTable)
      when(mockTable.getProvider).thenReturn(mockStandardProvider)
      val futureTask = new FutureTask[ViewPort](() => mockViewPort)
      futureTask.run()
      val callable = VirtualizedViewPortCallable(futureTask, null)

      val result = callable.call()

      result should equal(mockViewPort)
    }

    Scenario("WHEN the underlying FutureTask fails THEN the callable should log and propagate the exception") {
      val expectedException = new RuntimeException("Simulated data processing failure")

      val futureTask = new FutureTask[ViewPort](() => throw expectedException)
      futureTask.run()

      val callable = VirtualizedViewPortCallable(futureTask, null)

      val exception = intercept[ExecutionException] {
        callable.call()
      }

      exception.getCause should equal(expectedException)
    }
  }
}