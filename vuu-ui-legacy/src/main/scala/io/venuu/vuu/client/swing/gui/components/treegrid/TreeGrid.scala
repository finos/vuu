package io.venuu.vuu.client.swing.gui.components.treegrid

import org.jdesktop.swingx.JXTreeTable

import javax.swing.{JComponent, JTable}
import scala.swing.Component

class TreeGrid() extends Component{


//  val treeTable =
//
//  treeTable.setAutoResizeMode(JTable.AUTO_RESIZE_OFF);
//  treeTable.setRootVisible(false);
//  //treeTable.getColumnModel().getColumn(3).setCellRenderer(new PhotoRenderer());
//  treeTable.setRowHeight(50);

  override lazy val peer: JComponent =
{
  val noRootTreeTableModel = new ViewServerTreeModel()
  val treeTable = new JXTreeTable(noRootTreeTableModel) with SuperMixin
  treeTable.setAutoResizeMode(JTable.AUTO_RESIZE_OFF);
  treeTable.setRootVisible(false)
  treeTable.setRowHeight(50)
  treeTable
}

  override def toString(): String = "foo"
}
