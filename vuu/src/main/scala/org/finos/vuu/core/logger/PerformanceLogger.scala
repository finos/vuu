package org.finos.vuu.core.logger

import org.finos.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer, LifecycleEnabled}
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock

class PerformanceLogger(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultLifecycleEnabled {

  private val runner = new LifeCycleRunner("perf-logger", () => runOnce())



  def runOnce(): Unit  = {

  }

}
