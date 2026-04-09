package org.finos.vuu.net.json.mixin

import org.finos.vuu.viewport.{CellViewPortMenuItem, EmptyViewPortMenu, NoAction, RowViewPortMenuItem, SelectionViewPortMenuItem, TableViewPortMenuItem, ViewPortMenu, ViewPortMenuFolder}
import tools.jackson.core.{JsonGenerator, JsonParser}
import tools.jackson.databind.annotation.{JsonDeserialize, JsonSerialize}
import tools.jackson.databind.deser.std.StdDeserializer
import tools.jackson.databind.node.ArrayNode
import tools.jackson.databind.ser.std.StdSerializer
import tools.jackson.databind.{DeserializationContext, JsonNode, SerializationContext}

import scala.jdk.CollectionConverters.*

@JsonSerialize(`using` = classOf[ViewPortMenuSerializer])
@JsonDeserialize(`using` = classOf[ViewPortMenuDeserializer])
trait ViewPortMenuMixin { }

class ViewPortMenuSerializer extends StdSerializer[ViewPortMenu](classOf[ViewPortMenu]) {

  override def serialize(value: ViewPortMenu, gen: JsonGenerator, ctxt: SerializationContext): Unit = {

    value match {
      case EmptyViewPortMenu =>
        gen.writeStartObject()
        gen.writeStringProperty("name", EmptyViewPortMenu.name)
        gen.writeEndObject()

      case folder: ViewPortMenuFolder =>
        gen.writeStartObject()
        gen.writeStringProperty("name", folder.name)
        gen.writeArrayPropertyStart("menus")
        folder.menus.foreach(menu => serialize(menu, gen, ctxt))
        gen.writeEndArray()
        gen.writeEndObject()

      case menuItem: SelectionViewPortMenuItem =>
        gen.writeStartObject()
        gen.writeStringProperty("name", menuItem.name)
        gen.writeStringProperty("filter", menuItem.filter)
        gen.writeStringProperty("rpcName", menuItem.rpcName)
        gen.writeStringProperty("context", menuItem.context)
        gen.writeEndObject()

      case menuItem: CellViewPortMenuItem =>
        gen.writeStartObject()
        gen.writeStringProperty("name", menuItem.name)
        gen.writeStringProperty("filter", menuItem.filter)
        gen.writeStringProperty("rpcName", menuItem.rpcName)
        gen.writeStringProperty("context", menuItem.context)
        gen.writeStringProperty("field", menuItem.field)
        gen.writeEndObject()

      case menuItem: RowViewPortMenuItem =>
        gen.writeStartObject()
        gen.writeStringProperty("name", menuItem.name)
        gen.writeStringProperty("filter", menuItem.filter)
        gen.writeStringProperty("rpcName", menuItem.rpcName)
        gen.writeStringProperty("context", menuItem.context)
        gen.writeEndObject()

      case menuItem: TableViewPortMenuItem =>
        gen.writeStartObject()
        gen.writeStringProperty("name", menuItem.name)
        gen.writeStringProperty("filter", menuItem.filter)
        gen.writeStringProperty("rpcName", menuItem.rpcName)
        gen.writeStringProperty("context", menuItem.context)
        gen.writeEndObject()
    }
  }
}

class ViewPortMenuDeserializer extends StdDeserializer[ViewPortMenu](classOf[ViewPortMenu]) {

  override def deserialize(parser: JsonParser, ctxt: DeserializationContext): ViewPortMenu = {
    val node: JsonNode = ctxt.readTree(parser)
    processJsonNode(node)
  }

  private def processJsonNode(node: JsonNode): ViewPortMenu = {
    val name = node.path("name").asString()

    if (name.isEmpty) {
      EmptyViewPortMenu
    } else if (node.has("menus") && node.get("menus").isArray) {
      val menuArray = node.get("menus").asInstanceOf[ArrayNode]
      val children = menuArray.asScala.view.map(processJsonNode).toSeq
      ViewPortMenuFolder(name, children)
    } else {
      val context = node.path("context").asString()
      val filter = node.path("filter").asString()
      val rpcName = node.path("rpcName").asString()

      val item: ViewPortMenu = context match {
        case "selected-rows" =>
          SelectionViewPortMenuItem(name, filter, (_, _) => NoAction, rpcName)

        case "row" =>
          RowViewPortMenuItem(name, filter, (_, _, _) => NoAction, rpcName)

        case "grid" =>
          TableViewPortMenuItem(name, filter, _ => NoAction, rpcName)

        case "cell" =>
          val field = node.path("field").asString()
          CellViewPortMenuItem(name, filter, (_, _, _, _) => NoAction, rpcName, field)

        case _ => EmptyViewPortMenu
      }
      item
    }
  }

}

