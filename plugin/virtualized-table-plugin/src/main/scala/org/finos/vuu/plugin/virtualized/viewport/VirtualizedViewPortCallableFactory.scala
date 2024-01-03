package org.finos.vuu.plugin.virtualized.viewport

import org.finos.toolbox.thread.WorkItem
import org.finos.vuu.feature.ViewPortCallableFactory
import org.finos.vuu.viewport.{ViewPort, ViewPortContainer}

import java.util.concurrent.{Callable, FutureTask}

class VirtualizedViewPortCallableFactory extends ViewPortCallableFactory {

  override def createCallable(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort] = {
    VirtualizedViewPortCallable(r, viewPortContainer)
  }

  override def createWorkItem(vp: ViewPort, viewPortContainer: ViewPortContainer): WorkItem[ViewPort] = {
    VirtualizedViewPortWorkItem(vp, viewPortContainer)
  }
}
