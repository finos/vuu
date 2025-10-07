package org.finos.toolbox.lifecycle

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.TestFriendlyClock
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class LifecycleDAGTest extends AnyFeatureSpec with Matchers {

  class CompA()(implicit val lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging{
    override def doStart(): Unit = {
      logger.debug("Starting A")
    }

    override def doInitialize(): Unit = {
      logger.debug("Initializing A")
    }

    override val lifecycleId: String = "A"
  }

  class CompB(compA: CompA) (implicit val lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging{

    lifecycle(this).dependsOn(compA)

    override def doStart(): Unit = {
      logger.debug("Starting B")
    }

    override def doStop(): Unit = {

    }

    override def doInitialize(): Unit = {
      logger.debug("Initializing B")
    }

    override def doDestroy(): Unit = ???

    override val lifecycleId: String = "B"
  }

  class CompC(compA: CompA, compB: CompB)(implicit val lifecycle: LifecycleContainer) extends DefaultLifecycleEnabled with StrictLogging{

    lifecycle(this).dependsOn(compA, compB)
    //lifecycle(this).dependsOn(compB)

    override def doStart(): Unit = logger.debug("Starting C")

    override val lifecycleId: String = "C"

    override def doInitialize(): Unit = {
      logger.debug("Initializing C")
    }
  }

  Feature("Test that a lifecycle DAG is possible"){

    Scenario("check that we can create a DAG"){

      implicit val clock = new TestFriendlyClock(1000L)

      implicit val lifecycle = new LifecycleContainer

      val a = new CompA()

      val b = new CompB(a)

      val c = new CompC(a, b)

      lifecycle.start()
    }



    Scenario("check our DAG works") {

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

    Scenario("Generate graphViz"){

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

      LifecycleGraphviz("test-graphviz", graph)
    }

  }

}
