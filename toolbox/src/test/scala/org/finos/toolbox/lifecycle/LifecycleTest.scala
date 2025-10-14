package org.finos.toolbox.lifecycle

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class LifecycleTest extends AnyFeatureSpec with Matchers {

  val startSeq = new scala.collection.mutable.ListBuffer[String]()

  val stopSeq = new scala.collection.mutable.ListBuffer[String]()

  case class CompX()(using lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging {

    override val lifecycleId: String = "X"

    println("-->" + lifecycleId)
    lifecycle(this)
    override def doStop(): Unit = stopSeq.+=("X")
    override def doStart(): Unit = startSeq.+=("X")

  }

  case class CompY()(using lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging {
    override val lifecycleId: String = "Y"
    println("-->" + lifecycleId)
    lifecycle(this)
    override def doStop(): Unit = stopSeq.+=("Y")
    override def doStart(): Unit = startSeq.+=("Y")

  }

  case class CompZ()(using lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging {
    override val lifecycleId: String = "Z"
    println("-->" + lifecycleId)
    lifecycle(this)
    override def doStop(): Unit = stopSeq.+=("Z")
    override def doStart(): Unit = startSeq.+=("Z")

  }

  Feature("check that the lifecycle behaves as we expect on startup"){

    Scenario("add non-dependent components at same level and check the start order"){

      given clock: Clock = new TestFriendlyClock(1000L)

      given lifecycle: LifecycleContainer = new LifecycleContainer

      lifecycle.add(CompX())
      lifecycle.add(CompY())
      lifecycle.add(CompZ())

      lifecycle.start()

      startSeq should equal(List("X", "Y", "Z"))

      lifecycle.stop()

      stopSeq should equal(List("Z", "Y", "X"))

    }

  }


}
