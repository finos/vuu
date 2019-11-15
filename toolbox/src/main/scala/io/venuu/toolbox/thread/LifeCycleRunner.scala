/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 18/11/2015.

  */
package io.venuu.toolbox.thread

import io.venuu.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import io.venuu.toolbox.time.Clock

class LifeCycleRunner(name: String, func: () => Unit, minCycleTime: Long = 100)(implicit lifecycle: LifecycleContainer, timeProvider: Clock) extends Runner(name, func, minCycleTime) with LifecycleEnabled {

  lifecycle(this)

  override def doStart(): Unit = runInBackground()
  override def doStop(): Unit = stop()
  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "lifeCycleRunner-" + name
}

/**
  * Lifecycle runner that runs once then exits, it is also lifecycle aware, so will exit if it is interrupted.
  *
  * @param name
  * @param func
  * @param minCycleTime
  * @param lifecycle
  * @param timeProvider
  */
class RunOnceLifeCycleRunner(name: String, func: () => Unit, minCycleTime: Long = 100)(implicit lifecycle: LifecycleContainer, timeProvider: Clock) extends Runner(name, func, minCycleTime, runOnce = true) with LifecycleEnabled {

  lifecycle(this)

  override def doStart(): Unit = runInBackground()
  override def doStop(): Unit = stop()
  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "runOnceLifeCycleRunner-" + name

}

