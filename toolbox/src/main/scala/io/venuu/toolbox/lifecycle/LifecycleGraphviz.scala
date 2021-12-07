package io.venuu.toolbox.lifecycle

import java.io.PrintWriter

object LifecycleGraphviz {

  def apply[NODE](name: String, graph: DirectedAcyclicGraph[NODE]) = {

    val fileName = name + ".txt"

    val pw = new PrintWriter(fileName)

    println("Writing the graphviz to " + fileName)

    writeHeader(name, pw)

    graph.nodeMap.values.zipWithIndex.foreach({ case (node, i) => {
      writeNode[NODE](i, node.n, pw)
    }
    })

    graph.roots.foreach(root => {
      writeVertex(graph, root, pw)

    })

    writeFooter(pw)
    pw.close()
  }

  private def writeVertex[NODE](graph: DirectedAcyclicGraph[NODE], node: DefaultNode[NODE], pw: PrintWriter): Unit = {
    node.outgoingEdges.foreach( child => {
      val parentName = "n" + node.n.toString.replace(".", "").replace("@", "_")

      val childNode = graph.getNode(child.sinkNode)

      val childName = "n" + childNode.n.toString.replace(".", "").replace("@", "_")

      pw.write(s"\t $parentName -> $childName ; \n")

      writeVertex[NODE](graph, childNode, pw)
    })
  }

  private def writeHeader(name: String, pw: PrintWriter) = {
    pw.write("digraph regexp { \n")
    pw.write("\t rankdir=\"LR\"")
    pw.write("\t node [fontsize=10, shape=box, height=0.25]")
    pw.write("\t edge [fontsize=10]")
  }

  private def writeNode[NODE](i: Int, n: NODE, pw: PrintWriter) = {

    val nodeAsString = n.toString.replace(".", "").replace("@", "_")
    val nodeName = "n" + nodeAsString.replace(".", "").replace("@", "_")

    val str = "\t " + nodeName + " [label=\"" +  nodeAsString +  "\", URL=\"https://godoc.org/regexp\", tooltip=\"Package regexp implements regular expression search.\"]; \n"

    pw.write(str)
  }


  private def writeFooter(pw: PrintWriter) = {
    pw.write("}")
  }

}
