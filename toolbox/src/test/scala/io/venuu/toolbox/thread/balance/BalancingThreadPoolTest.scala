package io.venuu.toolbox.thread.balance

import io.venuu.toolbox.thread.balancing.{BinPackingAlgo, SimpleBinPackingAlgo, WorkByThread, ThreadIdentifer, TimedWork}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class BalancingThreadPoolTest extends AnyFeatureSpec with Matchers {

  Feature("test balancing work`"){

    Scenario("test first cycle"){

      val work = List(
        TimedWork("vp-001", 20.0), TimedWork("vp-002", 12.0), TimedWork("vp-003", 10.0),
        TimedWork("vp-004", 5.0), TimedWork("vp-005", 7.0), TimedWork("vp-006", 4.0),
        TimedWork("vp-007", 1.0), TimedWork("vp-008", 1.0), TimedWork("vp-009", 10.0),
        TimedWork("vp-010", 7.0)
      )

      val bucketCount = 3

      val algo: BinPackingAlgo[String] = new SimpleBinPackingAlgo[String]

      val (results, timeByThread) = algo.solve(work, bucketCount)

      val expectedResults = List(
        WorkByThread("vp-001", ThreadIdentifer(0)), WorkByThread("vp-002", ThreadIdentifer(1)), WorkByThread("vp-009", ThreadIdentifer(2)),
        WorkByThread("vp-003", ThreadIdentifer(2)), WorkByThread("vp-010", ThreadIdentifer(1)), WorkByThread("vp-005", ThreadIdentifer(1)),
        WorkByThread("vp-004", ThreadIdentifer(0)), WorkByThread("vp-006", ThreadIdentifer(2)), WorkByThread("vp-008", ThreadIdentifer(2)),
        WorkByThread("vp-007", ThreadIdentifer(0))
      )

      results shouldEqual(expectedResults)

      timeByThread should equal(
        Map(ThreadIdentifer(0) -> 26.0, ThreadIdentifer(1) -> 26.0, ThreadIdentifer(2) -> 25.0)
      )

      println("time by thread" + timeByThread)
    }

    Scenario("test subsequent cycles"){

      val work = List(
        TimedWork("vp-001", 20.0), TimedWork("vp-002", 12.0), TimedWork("vp-003", 10.0),
        TimedWork("vp-004", 5.0), TimedWork("vp-005", 7.0), TimedWork("vp-006", 4.0),
        TimedWork("vp-007", 1.0), TimedWork("vp-008", 1.0), TimedWork("vp-009", 10.0),
        TimedWork("vp-010", 7.0)
      )

      val bucketCount = 3

      val algo: BinPackingAlgo[String] = new SimpleBinPackingAlgo[String]

      val (results, timeByThread) = algo.solve(work, bucketCount)

      work.map(_.time).sum shouldEqual(timeByThread.values.sum)

      val work2 = List(
        TimedWork("vp-001", 20.0), TimedWork("vp-002", 12.0), TimedWork("vp-003", 10.0),
        TimedWork("vp-004", 5.0), TimedWork("vp-005", 7.0), TimedWork("vp-006", 4.0),
                                                              //removed unit of work...
        TimedWork("vp-007", 1.0), TimedWork("vp-008", 1.0), //UnitOfWork("vp-009", 10.0),
        //lower cost of work (i.e. was made cheaper in processing time)
        TimedWork("vp-010", 1.0),
        //added 3 more viewports
        TimedWork("vp-011", 10.0), TimedWork("vp-012", 4.0), TimedWork("vp-013", 7.0)
      )

      val (results2, timeByThread2) = algo.solve(work2, bucketCount)

      val (added, removed, changed) = algo.diff(results, results2)

      added shouldEqual(
        List(
          WorkByThread("vp-011", ThreadIdentifer(2)),
          WorkByThread("vp-013", ThreadIdentifer(1)),
          WorkByThread("vp-012", ThreadIdentifer(2))),
      )

      removed shouldEqual(
        List(WorkByThread("vp-009", ThreadIdentifer(2))),
      )

      changed shouldEqual(
        List(
          WorkByThread("vp-010", ThreadIdentifer(0)),
          WorkByThread("vp-008", ThreadIdentifer(0)),
          WorkByThread("vp-007", ThreadIdentifer(1))
        ),
      )

      timeByThread2 should equal(
        Map(ThreadIdentifer(0) -> 27.0, ThreadIdentifer(1) -> 27.0, ThreadIdentifer(2) -> 28.0)
      )

      work2.map(_.time).sum shouldEqual(timeByThread2.values.sum)

      println("time by thread" + timeByThread2)

    }
  }
}
