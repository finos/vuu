package org.finos.vuu.feature.inmem.viewport

import org.finos.toolbox.thread.WorkItem
import org.finos.vuu.feature.ViewPortTreeCallableFactory
import org.finos.vuu.viewport.{InMemViewPortTreeCallable, InMemViewPortTreeWorkItem, ViewPort, ViewPortContainer}

import java.util.concurrent.{Callable, FutureTask}

class InMemViewPortTreeCallableFactory extends ViewPortTreeCallableFactory{
  override def createCallable(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort] = InMemViewPortTreeCallable(r, viewPortContainer)
  override def createWorkItem(vp: ViewPort, viewPortContainer: ViewPortContainer): WorkItem[ViewPort] = InMemViewPortTreeWorkItem(vp, viewPortContainer)
}
