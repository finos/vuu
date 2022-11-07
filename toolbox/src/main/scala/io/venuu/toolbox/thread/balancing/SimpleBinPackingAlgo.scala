package io.venuu.toolbox.thread.balancing

class SimpleBinPackingAlgo[WORK] extends BinPackingAlgo[WORK] {

  def indexOfSmallest(array: Seq[Double]): Int = {
    val result = array.foldLeft(-1,Double.MaxValue,0) {
      case ((maxIndex, maxValue, currentIndex), currentValue) =>
        if(currentValue < maxValue) (currentIndex,currentValue,currentIndex+1)
        else (maxIndex,maxValue,currentIndex+1)
    }
    result._1
  }

  def diff(last: List[WorkByThread[WORK]], latest: List[WorkByThread[WORK]]): (List[WorkByThread[WORK]], List[WorkByThread[WORK]], List[WorkByThread[WORK]]) = {

    val added   = latest.filter( work => !last.map(_.work).contains(work.work) )
    val removed = last.filter( work => !latest.map(_.work).contains(work.work) )
    val changed = latest
      .filter( work => !added.map(_.work).contains(work.work))
      .filter( work => !removed.map(_.work).contains(work.work))
      //this contains the sets mins the addituions and the removals
      .filter( work => !last.contains(work) )

    (added, removed, changed)
  }

  def solve(work: List[TimedWork[WORK]], buckets: Int): (List[WorkByThread[WORK]], Map[ThreadIdentifer, Double]) = {

    var results: List[WorkByThread[WORK]] = List()

    val sorted = work.sortBy(_.time).reverse

    val threads = (0 until buckets).map(ThreadIdentifer)

    var timeByThreads = threads.map( ti => (ti, 0.0) ).toMap

    for(i <- 0 until buckets){

      //val bucket: Int = i

      val value = sorted(i)

      val thread = threads(i)

      val totalByThread = timeByThreads(thread) + value.time

      timeByThreads = timeByThreads ++ Map(thread -> totalByThread)

      results = results ++ List(WorkByThread(value.work, thread))
    }

    for(i <- buckets until sorted.length){

      //val grouped = results.groupBy(_.thread)

      val thread = timeByThreads.minBy(_._2)._1

      val value = sorted(i)

      val totalByThread = timeByThreads(thread) + value.time

      timeByThreads = timeByThreads ++ Map(thread -> totalByThread)

      results = results ++ List(WorkByThread(value.work, thread))
    }

    (results, timeByThreads)
  }

}
