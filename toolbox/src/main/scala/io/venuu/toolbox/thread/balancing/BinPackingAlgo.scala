package io.venuu.toolbox.thread.balancing

trait BinPackingAlgo[WORK] {
  def solve(work: List[TimedWork[WORK]], buckets: Int): (List[WorkByThread[WORK]], Map[ThreadIdentifer, Double])
  def diff(last: List[WorkByThread[WORK]], latest: List[WorkByThread[WORK]]): (List[WorkByThread[WORK]], List[WorkByThread[WORK]], List[WorkByThread[WORK]])

  /*
  List[ThreadAlignedUnitOfWork[WORK]
   */
}
