package io.venuu.toolbox.thread.balancing

case class TimedWork[WORK](work: WORK, time: Double)

case class ThreadIdentifer(index: Int)
case class WorkByThread[WORK](work: WORK, thread: ThreadIdentifer)
