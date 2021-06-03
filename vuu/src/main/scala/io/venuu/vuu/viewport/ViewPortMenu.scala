package io.venuu.vuu.viewport

object ViewPortMenu {
    def apply(menus: ViewPortMenu*): ViewPortMenu = {
      new ViewPortMenu("", menus)
    }

    def apply(name: String, menus: ViewPortMenu*): ViewPortMenu = {
      new ViewPortMenu("", menus)
    }
}

class ViewPortMenu(val name:String, val menus: Seq[ViewPortMenu]) {
}

object EmptyViewPortMenu extends ViewPortMenu("", Seq())

trait Scope{}

object Row extends Scope
object Selection extends Scope
object Field extends Scope

class SelectionViewPortMenuItem(name: String, filter: String, func: (ViewPortSelection) => Unit) extends ViewPortMenuItem(name, filter){}

class CellViewPortMenuItem(name: String, filter: String, func: (String, Object) => Unit) extends ViewPortMenuItem(name, filter){}

class TableViewPortMenuItem(name: String, filter: String, func: () => Unit) extends ViewPortMenuItem(name, filter){}

class RowViewPortMenuItem(name: String, filter: String, func: (String, Map[String, AnyRef]) => Unit) extends ViewPortMenuItem(name, filter){}

class ViewPortMenuItem(name: String, filter: String) extends ViewPortMenu(name, Seq()){

  def this(name: String){
    this(name, "")
  }

}