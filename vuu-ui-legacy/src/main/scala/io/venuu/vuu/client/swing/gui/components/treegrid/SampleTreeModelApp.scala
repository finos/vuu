package io.venuu.vuu.client.swing.gui.components.treegrid

import scala.swing._

object SampleTreeModelApp extends SimpleSwingApplication{

  val treeTable = new TreeGrid()

  def top = new MainFrame {
    title = "Foo"
    //contents = treeTable
    contents = new BorderPanel{
      layout(new Button("Chris")) = BorderPanel.Position.North
      layout(treeTable) = BorderPanel.Position.Center
    }
  }
}
