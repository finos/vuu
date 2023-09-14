package org.finos.vuu.viewport

import com.typesafe.scalalogging.StrictLogging

import java.util.concurrent.{Callable, FutureTask}

trait ViewPortCallableMBean {
  def apply(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort]
}
object ViewPortCallable extends StrictLogging with ViewPortCallableMBean {

  def apply(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort] = {
    () => {
      try {
        val viewport = r.get()
        viewPortContainer.refreshOneViewPort(viewport)
        viewport
      } catch {
        case e: Exception => logger.error(e.getMessage + " - " + e.getStackTrace)
          null
      }
    }
  }
}

object ViewPortTreeCallable extends StrictLogging with ViewPortCallableMBean {

  def apply(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort] = {
    () => {
      try {
        val viewport = r.get()
        viewPortContainer.refreshOneTreeViewPort(viewport)
        viewport
      } catch {
        case e: Exception => logger.error(e.getMessage + " - " + e.getStackTrace)
          null
      }
    }
  }
}

