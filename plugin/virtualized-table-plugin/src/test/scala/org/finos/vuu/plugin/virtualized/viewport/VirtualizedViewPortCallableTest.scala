package org.finos.vuu.plugin.virtualized.viewport

import org.finos.vuu.core.table.DataTable
import org.finos.vuu.provider.{Provider, VirtualizedProvider}
import org.finos.vuu.viewport.{RowSource, ViewPort}
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.{ExecutionException, FutureTask}

class VirtualizedViewPortCallableTest extends AnyFeatureSpec with Matchers with MockFactory {

  Feature("VirtualizedViewPortCallable Execution") {

    Scenario("WHEN the provider is a VirtualizedProvider THEN it should execute runOnce and return the viewport") {
      val mockViewPort = mock[ViewPort]
      val mockTable = mock[DataTable]
      val mockVirtualizedProvider = mock[VirtualizedProvider]

      (() => mockViewPort.table).expects().returning(mockTable)
      (() => mockTable.asTable).expects().returning(mockTable)
      (() => mockTable.getProvider).expects().returning(mockVirtualizedProvider)

      (mockVirtualizedProvider.runOnce _).expects(mockViewPort).once()

      val futureTask = new FutureTask[ViewPort](() => mockViewPort)
      futureTask.run()

      val callable = VirtualizedViewPortCallable(futureTask, null)

      val result = callable.call()

      result should equal(mockViewPort)
    }

    Scenario("WHEN the provider is NOT a VirtualizedProvider THEN it should skip execution and return the viewport safely") {
      val mockViewPort = mock[ViewPort]
      val mockTable = mock[DataTable]
      val mockStandardProvider = mock[Provider]

      (() => mockViewPort.table).expects().returning(mockTable)
      (() => mockTable.asTable).expects().returning(mockTable)
      (() => mockTable.getProvider).expects().returning(mockStandardProvider)

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