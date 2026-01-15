package org.finos.toolbox.lifecycle

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.thread.Runner
import org.finos.toolbox.time.Clock

import java.util.concurrent.atomic.AtomicInteger
import scala.collection.mutable
import scala.collection.mutable.ListBuffer

/*
my ideal data structure is:

  Leaf -> Branch -> Branch -> Root
          Leaf   -> Branch -> Root
          Leaf   -> Branch -> Root

  such that I could find the longest path to root and then
  enabled the

*/

trait LifeCycleEdge{
  def sourceNode: DefaultLifeCycleNode
  def sinkNode: DefaultLifeCycleNode
}

class SimpleTopoSort[NODE](graph: DirectedAcyclicGraph[NODE]) extends StrictLogging {

  def sort(): List[List[NODE]] = {
    val dup = graph.copy()

    val list = new ListBuffer[List[NODE]]()

    while(!dup.isEmpty){

      val orderedInLevel = new ListBuffer[NODE]()

      val noIncoming = dup.getNodesWithNoIncomingEdges()

      logger.debug(s"found nodes with noIncoming=$noIncoming")

      noIncoming.foreach(dup.removeNode(_))

      noIncoming.foreach(n => orderedInLevel.+=(n))

      list.+=(orderedInLevel.toList)
    }

    list.toList
  }
}

class TarjanTopologicalSort[NODE](val nodeSet:mutable.HashMap[NODE, DefaultNode[NODE]]){

  def sort() ={

    val unMarkedNodes = new mutable.LinkedHashSet[DefaultNode[NODE]]()
    val markedNodes = new mutable.LinkedHashSet[DefaultNode[NODE]]()
    val tempMarkedNodes = new mutable.LinkedHashSet[DefaultNode[NODE]]()

    nodeSet.values.foreach(n => unMarkedNodes.add(n))

    var list = List[DefaultNode[NODE]]()

    while(!unMarkedNodes.isEmpty){
      val node = unMarkedNodes.head
      list = list ++ visit(node, markedNodes, tempMarkedNodes, unMarkedNodes)
    }

    list
  }

  def visit(n: DefaultNode[NODE],
                  marked: mutable.LinkedHashSet[DefaultNode[NODE]],             tempMarked: mutable.LinkedHashSet[DefaultNode[NODE]],
                  unmarkedNodes:  mutable.LinkedHashSet[DefaultNode[NODE]]): List[DefaultNode[NODE]] = {

    println("visiting:" + n.n)

    if(tempMarked.contains(n))
      throw new Exception(s"Cycle deteced, this is not a DAG, tempMarked already contains ($n)")

    if(!marked.contains(n)){
      tempMarked.add(n)

      val visited = n.outgoingEdges.flatMap(edge => visit(nodeSet.get(edge.sinkNode).get, marked, tempMarked, unmarkedNodes))

      marked.add(n)
      unmarkedNodes.remove(n)
      tempMarked.remove(n)

      n :: visited.toList
    }
    else{
      List()
    }
  }

}

case class DefaultNode[NODE](n: NODE, index: Int, var incomingEdges: Set[DefaultEdge[NODE]] = Set[DefaultEdge[NODE]](), var outgoingEdges: Set[DefaultEdge[NODE]] = Set[DefaultEdge[NODE]]() )
case class DefaultEdge[NODE](sourceNode: NODE, sinkNode: NODE){

}

case class DefaultLifeCycleNode(incomingEdges: Set[LifeCycleEdge], outgoingEdges:Set[LifeCycleEdge])

class  DirectedAcyclicGraph[NODE] private (var edgeSet : Set[DefaultEdge[NODE]], var nodeMap : Map[NODE, DefaultNode[NODE]]) extends StrictLogging{

  private val counter = new AtomicInteger(0)

//  var edgeSet = new mutable.HashSet[DefaultEdge[NODE]]()
//  private val nodeSet = new mutable.HashMap[NODE, DefaultNode[NODE]]()

  def this() = this(Set[DefaultEdge[NODE]](), Map[NODE, DefaultNode[NODE]]())

  def isEmpty = {
    nodeMap.isEmpty
  }

  def copy(): DirectedAcyclicGraph[NODE] = {
    new DirectedAcyclicGraph[NODE](edgeSet, nodeMap)
  }

  def getNodesWithNoIncomingEdges(): List[NODE] = {
    nodeMap.values.filter( _.incomingEdges.size == 0 ).map(n => n.n).toList
  }

  def removeNode(n: NODE): Unit = {

    nodeMap.get(n) match {
      case Some(node) => {
        node.outgoingEdges.foreach(removeEdge(_))
        logger.debug(s"removing node $node")
        nodeMap = nodeMap.-(node.n)
      }
      case None => logger.debug(s"Node not found in graph $n")
    }

  }

  def containsNode(n: NODE) = nodeMap.contains(n)

  def containsEdge(n1: NODE, n2: NODE) = {
    val edge = DefaultEdge(n1, n2)
    edgeSet.contains(edge)
  }

  def getNode(n: NODE) = nodeMap.get(n).get

  def removeEdge(edge: DefaultEdge[NODE])= {
    logger.debug(s"removing edge $edge")
    val sinkNode = getNode(edge.sinkNode)
    val newSink = sinkNode.copy(incomingEdges = sinkNode.incomingEdges.-(edge))
    nodeMap = nodeMap.+(newSink.n -> newSink)
  }

  def addNode(n: NODE): Unit = nodeMap = nodeMap ++ Map(n -> DefaultNode(n, counter.getAndIncrement()))

  def addEdge(n: NODE, n2: NODE): Unit = {

    if(!nodeMap.contains(n)){
      nodeMap = nodeMap.+(n -> DefaultNode[NODE](n, counter.getAndIncrement()))
    }

    if(!nodeMap.contains(n2)){
      nodeMap.+=(n2 -> DefaultNode[NODE](n2, counter.getAndIncrement()))
    }

    val edge = DefaultEdge[NODE](n, n2)

    if(!edgeSet.contains(edge))
      edgeSet = edgeSet.+(edge)

    val node1 = nodeMap.get(n).get
    val node2 = nodeMap.get(n2).get

    node1.outgoingEdges = node1.outgoingEdges ++ Set(edge)
    node2.incomingEdges = node2.incomingEdges ++ Set(edge)
  }

  def roots: List[DefaultNode[NODE]] = {
    nodeMap.values.filter( n => n.incomingEdges.size == 0).map( node => node ).toList
  }

  def topologicalSort: List[List[NODE]] = {
    new SimpleTopoSort[NODE](this).sort()
    //new TarjanTopologicalSort(nodeSet).sort().map(_.n)
  }

  def getIncomingEdges(n: NODE): Set[DefaultEdge[NODE]] = {
    nodeMap.get(n) match {
      case Some(node) => node.incomingEdges
      case None => Set()
    }
  }

  def getOutgoingEdges(n: NODE): Set[DefaultEdge[NODE]] ={
    nodeMap.get(n) match {
      case Some(node) => node.outgoingEdges
      case None => Set()
    }
  }

}

trait LifecycleEnabled{
  def doStart() : Unit
  def doStop() : Unit
  def doInitialize() : Unit
  def doDestroy() : Unit
  val lifecycleId: String
  override def toString: String = getClass.getSimpleName
}

abstract class DefaultLifecycleEnabled extends LifecycleEnabled {
  override def doStart(): Unit = {}
  override def doStop(): Unit = {}
  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
  override val lifecycleId: String = ""
}

class LifecycleContainer(implicit clock: Clock) extends StrictLogging {

  val thread = new Runner("lifeCycleJoinRunner", () => {Thread.sleep(1000)})
  thread.runInBackground()

  private val dependencyGraph = new DirectedAcyclicGraph[LifecycleEnabled]()

  def autoShutdownHook(): Unit = {
    val container = this
    Runtime.getRuntime.addShutdownHook(new Thread(new Runnable {
      override def run(): Unit = {
        thread.stop()
        container.stop()
      }
    }, "lcShutdownHook"))
  }

  def apply(comp: LifecycleEnabled): LifeCycleComponentContext = {

    if(!dependencyGraph.containsNode(comp))
      dependencyGraph.addNode(comp)
    else
      logger.debug(s"lifecycle already contains component $comp")

    LifeCycleComponentContext(comp, this, dependencyGraph)
  }

  def add(component: LifecycleEnabled): Unit = {}

  def start() = {
    logger.debug("Starting lifecycle")
    val sort = dependencyGraph.topologicalSort
    val startSequence = sort.reverse

    startSequence.foreach( list => initOneBucket(list) )
    startSequence.foreach( list => startOneBucket(list) )

    logger.debug("Started lifecycle")
  }

  private def initOneBucket(startSequence: List[LifecycleEnabled]): Unit = {
    startSequence.foreach( comp => {
      logger.debug(s"Initializing ${comp.getClass} ${comp.lifecycleId}")
      comp.doInitialize()
    })
  }

  private def startOneBucket(startSequence: List[LifecycleEnabled]): Unit = {
    startSequence.foreach( comp => {
      logger.debug(s"Starting ${comp.getClass} ${comp.lifecycleId}")
      comp.doStart()
    })
  }

  private def stopOneBucket(startSequence: List[LifecycleEnabled]): Unit = {
    startSequence.reverse.foreach( comp => {
      logger.debug(s"Stopping ${comp.getClass} ${comp.lifecycleId}")
      comp.doStop()
    })
  }

  private def destroyOneBucket(startSequence: List[LifecycleEnabled]): Unit = {
    startSequence.reverse.foreach( comp => {
      logger.debug(s"Destroying ${comp.getClass}")
      comp.doDestroy()
    })
  }

  def join() = {
    thread.join()
  }

  def stop() = {
    val sort = dependencyGraph.topologicalSort
    val startSequence = sort
    startSequence.foreach( list => stopOneBucket(list) )
    startSequence.foreach( list => destroyOneBucket(list) )
    logger.debug("Shutdown lifecycle")
  }
}

case class LifeCycleComponentContext(comp: LifecycleEnabled,
                                     container: LifecycleContainer,
                                     dependencyGraph:  DirectedAcyclicGraph[LifecycleEnabled]) extends StrictLogging {
  def dependsOn(comp2: LifecycleEnabled): Unit = {
    if (!dependencyGraph.containsEdge(comp, comp2))
      dependencyGraph.addEdge(comp, comp2)
    else
      logger.warn(s"lifecycle already contains edge $comp, $comp2")
  }

  def dependsOn(comps: LifecycleEnabled*): Unit = {
    comps.foreach(c => {
      if (!dependencyGraph.containsEdge(comp, c))
        dependencyGraph.addEdge(comp, c)
      else
        logger.warn(s"lifecycle already contains edge $comp, $c")
    })
  }
}
