package io.venuu.toolbox.thread.balancing

import com.typesafe.scalalogging.StrictLogging

class BalancingWorkerContainer[WORK](val poolSize: Int,
                                     val workGenerator: WorkGenerator[WORK],
                                     val binPacker: BinPackingAlgo[WORK],
                                     val workerManager: WorkerManager[WORK]) extends WorkerManager[WORK] with StrictLogging {

  @volatile var lastRun: Option[List[WorkByThread[WORK]]] = None

  def runOnce(): Unit = {

    val work = workGenerator.generate()

    val (newWork, timeByThread) = binPacker.solve(work, poolSize)

    lastRun match {
      case Some(lastWork) =>
        val (added, removed, changed) = binPacker.diff(lastWork, newWork)
        onSubsequentSend(added, removed, changed)
        lastRun = Some(newWork)
      case None =>
        onFirstSend(newWork)
        lastRun = Some(newWork)
    }
  }

  def onFirstSend(work: List[WorkByThread[WORK]]): Unit ={

    work.foreach(work => {
      workerManager.getWorker(work.thread.index) match {
        case Some(worker) =>
          worker.onNewWork(work.thread.index, work)
        case None =>
          logger.error("No worker found, v v bad")
      }
    })

  }

  def onSubsequentSend(added: List[WorkByThread[WORK]], removed: List[WorkByThread[WORK]], changed: List[WorkByThread[WORK]]): Unit ={

  }

  override def getWorker(index: Int): Option[BalancingWorker[WORK]] = ???

  override def moveToDifferentThread(work: WorkByThread[WORK]): Unit = ???
}
