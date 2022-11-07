package io.venuu.vuu.viewport.balancing

import io.venuu.toolbox.thread.balancing.{BalancingWorker, WorkByThread, TimedWork}
import io.venuu.vuu.viewport.ViewPort

case class ActivatableUnitOfWork(isActive: Boolean, work: TimedWork[ViewPort])




class ViewPortBalancingWorker extends BalancingWorker[ViewPort] {

  override def runOnce(): Unit = ???

  override def onNewWork(index: Int, newWork: WorkByThread[ViewPort]): Unit = ???

  override def onRemovedWork(removedWork: WorkByThread[ViewPort]): Unit = ???

  override def onWorkChangedThread(changedWork: WorkByThread[ViewPort]): Unit = ???
}
