package io.venuu.toolbox.thread.balancing

import java.util
import java.util.concurrent.LinkedBlockingQueue
import scala.::

trait ThreadWorkEvent[WORK]

case class AddedWork[WORK](newWork: WorkByThread[WORK]) extends ThreadWorkEvent[WORK]
case class RemovedWork[WORK](newWork: WorkByThread[WORK]) extends ThreadWorkEvent[WORK]
case class ReassignedWork[WORK](newWork: WorkByThread[WORK]) extends ThreadWorkEvent[WORK]

trait BalancingWorker[WORK]{
    //this sends the full list of our work, we shouldn't start operating on any non-owned work until
    //we receieve the @moveToDifferentThread() call
    def onNewWork(index: Int, newWork: WorkByThread[WORK])
    //When we've had work from another thread, we won't start processing it until we've receieved
    //a message from that thread, that they have handed it off
    def onRemovedWork(removedWork: WorkByThread[WORK])
    //when work changes thread from this thread, to another, we tell the leaving thread that its moved
    def onWorkChangedThread(changedWork: WorkByThread[WORK])
    //process the work to do
    def runOnce(): Unit
}

class DefaultBalancingWorker[WORK](val workerManager: WorkerManager[WORK]) extends BalancingWorker[WORK]{

    private val eventQueue = new LinkedBlockingQueue[ThreadWorkEvent[WORK]](100)

    @volatile private var workList: List[WorkByThread[WORK]] = List()

    override def onNewWork(index: Int, newWork: WorkByThread[WORK]): Unit = eventQueue.put(AddedWork(newWork))
    override def onRemovedWork(removedWork: WorkByThread[WORK]): Unit = eventQueue.put(RemovedWork(removedWork))
    override def onWorkChangedThread(changedWork: WorkByThread[WORK]): Unit = eventQueue.put(ReassignedWork(changedWork))

    def processEvents(): Unit = {
        val collection = new util.ArrayList[ThreadWorkEvent[WORK]](50)

        eventQueue.drainTo(collection)

        val iterator = collection.iterator()

        while(iterator.hasNext){
            iterator.next() match {
                case AddedWork(work) =>
                    workList = workList ++ List(work)
                case RemovedWork(work) =>
                    workList = workList.filterNot(el => el == work)
                //when we reassign work to a thread, we send a message to the existing thread to ack
                //the change then get that thread to hand it to the new thread via the manager
                //this is so we don't have two threads generating keys for the same viewport which
                //could result in race conditions
                case ReassignedWork(work) =>
                    workList = workList.filterNot(el => el.work == work.work)
                    workerManager.moveToDifferentThread(work)
            }
        }
    }

    def doWork(): Unit = {

    }

    override def runOnce(): Unit = {
        processEvents()
        doWork()
    }
}

trait WorkerManager[WORK] {
    def getWorker(index: Int): Option[BalancingWorker[WORK]]
    def moveToDifferentThread(work : WorkByThread[WORK])
    def setWorkers(workers: Array[BalancingWorker[WORK]]): Unit
    def getWorkers(): Array[BalancingWorker[WORK]]
}

class DefaultWorkerManager[WORK](val poolSize: Int) extends WorkerManager[WORK] {

    private var workers: Array[BalancingWorker[WORK]] = Array()

    override def setWorkers(workers: Array[BalancingWorker[WORK]]): Unit = this.workers = workers
    override def getWorkers(): Array[BalancingWorker[WORK]] = workers

    override def getWorker(index: Int): Option[BalancingWorker[WORK]] = {
        Some(workers(index))
    }

    override def moveToDifferentThread(work: WorkByThread[WORK]): Unit = {
        workers(work.thread.index).onNewWork(work.thread.index, work)
    }
}

