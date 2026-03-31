package org.finos.vuu.viewport

import org.finos.vuu.net.ClientSessionId

trait ViewPortMenu

object ViewPortMenu {
  def apply(menus: ViewPortMenu*): ViewPortMenu = {
    new ViewPortMenuFolder("ROOT", menus)
  }

  def apply(name: String, menus: ViewPortMenu*): ViewPortMenu = {
    new ViewPortMenuFolder(name, menus)
  }
}

class ViewPortMenuFolder(val name: String, val menus: Seq[ViewPortMenu]) extends ViewPortMenu {}

object EmptyViewPortMenu extends ViewPortMenu {}

trait Scope {}

object Row extends Scope

object Selection extends Scope

object Field extends Scope

class SelectionViewPortMenuItem(override val name: String, override val filter: String, val func: (ViewPortSelection, ClientSessionId) => ViewPortAction, override val rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "selected-rows"
}

class CellViewPortMenuItem(override val name: String, override val filter: String, val func: (String, String, Object, ClientSessionId) => ViewPortAction, override val rpcName: String, val field: String = "*") extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "cell"
}

class TableViewPortMenuItem(override val name: String, override val filter: String, val func: ClientSessionId => ViewPortAction, override val rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "grid"
}

class RowViewPortMenuItem(override val name: String, override val filter: String, val func: (String, Map[String, AnyRef], ClientSessionId) => ViewPortAction, override val rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "row"
}

class ViewPortMenuItem(val name: String, val filter: String, val rpcName: String) extends ViewPortMenu {

  def this(name: String) = this(name, "", "")

}