package org.finos.vuu.feature

import org.finos.toolbox.thread.WorkItem
import org.finos.vuu.viewport.{ViewPort, ViewPortContainer}

import java.util.concurrent.{Callable, FutureTask}

/**
 * This trait allows us to abstract the processing logic for a particular viewport specifically for tree'd datasources.
 * This processing logic is returned as a futuretask/callable to an executor to run.
 *
 * See VuuServer.scala to look at the construction of these executors.
 */
trait ViewPortCallableFactory {
  def createCallable(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort]
  def createWorkItem(vp: ViewPort, viewPortContainer: ViewPortContainer): WorkItem[ViewPort]
}
