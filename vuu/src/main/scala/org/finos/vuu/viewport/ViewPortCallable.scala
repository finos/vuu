package org.finos.vuu.viewport

import java.util.concurrent.{Callable, FutureTask}

object ViewPortCallable {

  def apply(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort] = {
    () => {
      val viewport = r.get()
      viewPortContainer.refreshOneViewPort(viewport)
      viewport
    }
  }


}
