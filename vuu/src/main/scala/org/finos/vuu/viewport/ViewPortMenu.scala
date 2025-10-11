package org.finos.vuu.viewport

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.databind.annotation.{JsonDeserialize, JsonSerialize}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.json.{ViewPortMenuDeserializer, ViewPortMenuSerializer}

//@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
//@JsonSubTypes(Array(
//  new Type(value = classOf[SelectionViewPortMenuItem], name = "SELECTION_MENU"),
//  new Type(value = classOf[CellViewPortMenuItem], name = "CELL_MENU"),
//  new Type(value = classOf[TableViewPortMenuItem], name = "TABLE_MENU"),
//  new Type(value = classOf[RowViewPortMenuItem], name = "TABLE_MENU"),
//  new Type(value = classOf[ViewPortMenuFolder], name = "MENU_FOLDER"),
//  new Type(value = classOf[ViewPortMenuItem], name = "MENU_ITEM"),
//))
trait ViewPortMenuMixin {}

object ViewPortMenu {
  def apply(menus: ViewPortMenu*): ViewPortMenu = {
    new ViewPortMenuFolder("ROOT", menus)
  }

  def apply(name: String, menus: ViewPortMenu*): ViewPortMenu = {
    new ViewPortMenuFolder(name, menus)
  }
}

//@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
//@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
@JsonSerialize(using = classOf[ViewPortMenuSerializer])
@JsonDeserialize(using = classOf[ViewPortMenuDeserializer])
trait ViewPortMenu

//@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
//@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
@JsonSerialize(using = classOf[ViewPortMenuSerializer])
@JsonDeserialize(using = classOf[ViewPortMenuDeserializer])
class ViewPortMenuFolder(val name: String, val menus: Seq[ViewPortMenu]) extends ViewPortMenu {}

object EmptyViewPortMenu extends ViewPortMenu {
}

trait Scope {}

object Row extends Scope

object Selection extends Scope

object Field extends Scope

@JsonIgnoreProperties(Array("func", "menus"))
class SelectionViewPortMenuItem(override val name: String, filter: String, val func: (ViewPortSelection, ClientSessionId) => ViewPortAction, rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "selected-rows"
}

@JsonIgnoreProperties(Array("func", "menus"))
class CellViewPortMenuItem(override val name: String, filter: String, val func: (String, String, Object, ClientSessionId) => ViewPortAction, rpcName: String, val field: String = "*") extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "cell"
}

@JsonIgnoreProperties(Array("func", "menus"))
class TableViewPortMenuItem(override val name: String, filter: String, val func: (ClientSessionId) => ViewPortAction, rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "grid"
}

@JsonIgnoreProperties(Array("func", "menus"))
class RowViewPortMenuItem(override val name: String, filter: String, val func: (String, Map[String, AnyRef], ClientSessionId) => ViewPortAction, rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "row"
}

class ViewPortMenuItem(val name: String, val filter: String, val rpcName: String) extends ViewPortMenu {

  def this(name: String) = this(name, "", "")

}

