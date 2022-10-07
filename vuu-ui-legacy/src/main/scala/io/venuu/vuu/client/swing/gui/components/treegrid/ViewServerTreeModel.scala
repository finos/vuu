package io.venuu.vuu.client.swing.gui.components.treegrid

import org.jdesktop.swingx.treetable.AbstractTreeTableModel

case class TreeNode(val name: String, val children: List[TreeNode] = List()){
  def addChild(child: TreeNode): TreeNode = this.copy(children = children ++ List(child))
}

object LeafNode{
  def apply(name: String, data: Array[String]) = new LeafNode(name, data)
}

class LeafNode(override val name: String, val data: Array[String]) extends TreeNode(name, List())

class ViewServerTreeModel() extends AbstractTreeTableModel(){

  private val columns = Array("country", "exchange", "ric", "quantity")

  private val tree = TreeNode("")
    .addChild(
      TreeNode("UK")
        .addChild(LeafNode("VOD.L", Array("UK", "LSE-MAIN", "VOD.L", "100")))
        .addChild(LeafNode("BPAR.PA", Array("UK", "PAR-MAIN", "BPAR.PA", "100")))
        .addChild(LeafNode("BP.L",Array("UK", "LSE-MAIN", "BP.L", "100")))
    ).addChild(
      TreeNode("NL")
      .addChild(LeafNode("VOD.L",Array("NL", "LSE-MAIN", "VOD.L", "100")))
      .addChild(LeafNode("BPAR.PA",Array("NL", "PAR-MAIN", "BPAR.PA", "100")))
      .addChild(LeafNode("BP.L",Array("NL", "LSE-MAIN", "BP.L", "100")))
  )

  override def getColumnName(column: Int): String = columns(column)

  override def getColumnCount: Int = columns.length

  override def getValueAt(o: scala.Any, i: Int): AnyRef = {
    o match {
      case node: TreeNode =>
        i match {
          case 0 => node.name
          case _ => "-"
        }
//code is never executed as Leaf extends Tree
//      case node: LeafNode =>
//        i match {
//          case 0 => node.name
//          case 1 => node.data(0)
//          case 2 => node.data(1)
//          case 3 => node.data(3)
//          case 4 => node.data(4)
//        }
    }
  }

  override def getChild(parent: scala.Any, index: Int): AnyRef = {
    parent.asInstanceOf[TreeNode].children(index)
  }

  override def getChildCount(parent: scala.Any): Int = {
    if(parent.isInstanceOf[LeafNode]) 0
    else if(parent.isInstanceOf[TreeNode]) parent.asInstanceOf[TreeNode].children.size
    else 0
  }

  override def getIndexOfChild(parent: scala.Any, child: scala.Any): Int = {
    parent.asInstanceOf[TreeNode].children.indexOf(child)
  }
}


