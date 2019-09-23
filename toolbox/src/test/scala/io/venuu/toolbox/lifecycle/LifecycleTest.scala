/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 16/11/2015.

  */
package io.venuu.toolbox.lifecycle

import com.typesafe.scalalogging.StrictLogging
import org.scalatest.{FeatureSpec, Matchers}

class LifecycleTest extends FeatureSpec with Matchers {

  val startSeq = new scala.collection.mutable.ListBuffer[String]()

  val stopSeq = new scala.collection.mutable.ListBuffer[String]()

  case class CompX()(implicit lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging {

    override val lifecycleId: String = "X"

    println("-->" + lifecycleId)
    lifecycle(this)
    override def doStop(): Unit = stopSeq.+=("X")
    override def doStart(): Unit = startSeq.+=("X")

  }

  case class CompY()(implicit lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging {
    override val lifecycleId: String = "Y"
    println("-->" + lifecycleId)
    lifecycle(this)
    override def doStop(): Unit = stopSeq.+=("Y")
    override def doStart(): Unit = startSeq.+=("Y")

  }

  case class CompZ()(implicit lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging {
    override val lifecycleId: String = "Z"
    println("-->" + lifecycleId)
    lifecycle(this)
    override def doStop(): Unit = stopSeq.+=("Z")
    override def doStart(): Unit = startSeq.+=("Z")

  }


  feature("check that the lifecycle behaves as we expect on startup"){

    scenario("add non-dependent components at same level and check the start order"){

      implicit val lifecycle = new LifecycleContainer

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
