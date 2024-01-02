package org.finos.vuu.feature.inmem.viewport

import org.finos.toolbox.thread.WorkItem
import org.finos.vuu.feature.ViewPortCallableFactory
import org.finos.vuu.viewport.{InMemViewPortCallable, InMemViewPortWorkItem, ViewPort, ViewPortContainer}

import java.util.concurrent.{Callable, FutureTask}

class InMemViewPortCallableFactory extends ViewPortCallableFactory {
  override def createCallable(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort] = InMemViewPortCallable.apply(r, viewPortContainer)
  override def createWorkItem(vp: ViewPort, viewPortContainer: ViewPortContainer): WorkItem[ViewPort] = InMemViewPortWorkItem(vp, viewPortContainer)
}
