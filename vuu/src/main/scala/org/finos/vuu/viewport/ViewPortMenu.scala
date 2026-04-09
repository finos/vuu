package org.finos.vuu.viewport

import org.finos.vuu.net.ClientSessionId

sealed trait ViewPortMenu {
  def name: String
}

object ViewPortMenu {
  def apply(menus: ViewPortMenu*): ViewPortMenu = {
    ViewPortMenuFolder("ROOT", menus)
  }

  def apply(name: String, menus: ViewPortMenu*): ViewPortMenu = {
    ViewPortMenuFolder(name, menus)
  }
}

case class ViewPortMenuFolder(name: String, menus: Seq[ViewPortMenu]) extends ViewPortMenu { }

object EmptyViewPortMenu extends ViewPortMenu {
  override def name: String = ""
}

sealed trait ViewPortMenuItem extends ViewPortMenu {
  def filter: String
  def rpcName: String
  def context: String
}

case class SelectionViewPortMenuItem(name: String,
                                     filter: String,
                                     func: (ViewPortSelection, ClientSessionId) => ViewPortAction,
                                     rpcName: String) extends ViewPortMenuItem {
  val context: String = "selected-rows"
}

case class CellViewPortMenuItem(name: String,
                                filter: String,
                                func: (String, String, AnyRef, ClientSessionId) => ViewPortAction,
                                rpcName: String,
                                field: String = "*") extends ViewPortMenuItem {
  val context: String = "cell"
}

case class TableViewPortMenuItem(name: String,
                                 filter: String,
                                 func: ClientSessionId => ViewPortAction,
                                 rpcName: String) extends ViewPortMenuItem {
  val context: String = "grid"
}

case class RowViewPortMenuItem(name: String,
                               filter: String,
                               func: (String, Map[String, AnyRef], ClientSessionId) => ViewPortAction,
                               rpcName: String) extends ViewPortMenuItem {
  val context: String = "row"
}
