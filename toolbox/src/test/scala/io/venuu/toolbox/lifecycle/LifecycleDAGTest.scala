package io.venuu.toolbox.lifecycle

import com.typesafe.scalalogging.StrictLogging
import org.scalatest.{FeatureSpec, Matchers}

/**
 * Created by chris on 15/10/2015.
 */
class LifecycleDAGTest extends FeatureSpec with Matchers {

  class CompA()(implicit val lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging{
    override def doStart(): Unit = {
      logger.info("Starting A")
    }

    override def doInitialize(): Unit = {
      logger.info("Initializing A")
    }

    override val lifecycleId: String = "A"
  }

  class CompB(compA: CompA) (implicit val lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging{

    lifecycle(this).dependsOn(compA)

    override def doStart(): Unit = {
      logger.info("Starting B")
    }

    override def doStop(): Unit = {

    }

    override def doInitialize(): Unit = {
      logger.info("Initializing B")
    }

    override def doDestroy(): Unit = ???

    override val lifecycleId: String = "B"
  }

  class CompC(compA: CompA, compB: CompB)(implicit val lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging{

    lifecycle(this).dependsOn(compA, compB)
    //lifecycle(this).dependsOn(compB)

    override def doStart(): Unit = logger.info("Starting C")

    override val lifecycleId: String = "C"

    override def doInitialize(): Unit = {
      logger.info("Initializing C")
    }
  }

  feature("Test that a lifecycle DAG is possible"){

    scenario("check that we can create a DAG"){

      implicit val lifecycle = new LifecycleContainer

      val a = new CompA()

      val b = new CompB(a)

      val c = new CompC(a, b)

      lifecycle.start()
    }



    scenario("check our DAG works") {

      val graph = new DirectedAcyclicGraph[String]

      graph.addNode("a")
      graph.addNode("b")
      graph.addNode("c")
      graph.addNode("d")
      graph.addNode("e")
      graph.addNode("f")
      graph.addNode("g")
      graph.addNode("h")
      graph.addNode("i")
      graph.addNode("j")
      graph.addNode("k")

      graph.addEdge("a", "c")
      graph.addEdge("b", "c")
      graph.addEdge("c", "e")
      graph.addEdge("c", "d")
      graph.addEdge("d", "g")
      graph.addEdge("e", "g")
      graph.addEdge("e", "f")
      graph.addEdge("e", "h")
      graph.addEdge("b", "i")
      graph.addEdge("i", "j")
      graph.addEdge("h", "k")

      val sort = graph.topologicalSort
      sort should equal (List(
        List("a", "b"),
        List("i", "c"),
        List("e", "j", "d"),
        List("f", "g", "h"),
        List("k")))

    }
  }

}
