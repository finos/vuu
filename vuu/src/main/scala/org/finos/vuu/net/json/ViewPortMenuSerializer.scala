package org.finos.vuu.net.json

import com.fasterxml.jackson.core.{JsonGenerator, JsonParser}
import com.fasterxml.jackson.databind._
import org.finos.vuu.viewport._

import scala.jdk.CollectionConverters.IteratorHasAsScala

class ViewPortMenuSerializer extends JsonSerializer[ViewPortMenu] {

  override def serialize(t: ViewPortMenu, gen: JsonGenerator, serializerProvider: SerializerProvider): Unit = {
    t match {
      case EmptyViewPortMenu =>
        gen.writeStartObject()
        gen.writeStringField("name", "")
        gen.writeEndObject()
      case folder: ViewPortMenuFolder =>
        gen.writeStartObject()
        gen.writeStringField("name", folder.name)
        gen.writeArrayFieldStart("menus")
        folder.menus.foreach(menu => serialize(menu, gen, serializerProvider))
        gen.writeEndArray()
        gen.writeEndObject()
      case menuItem: SelectionViewPortMenuItem =>
        gen.writeStartObject()
        gen.writeStringField("name", menuItem.name)
        gen.writeStringField("filter", menuItem.filter)
        gen.writeStringField("rpcName", menuItem.rpcName)
        gen.writeStringField("context", menuItem.context)
        gen.writeEndObject()
      case menuItem: CellViewPortMenuItem =>
        gen.writeStartObject()
        gen.writeStringField("name", menuItem.name)
        gen.writeStringField("filter", menuItem.filter)
        gen.writeStringField("rpcName", menuItem.rpcName)
        gen.writeStringField("context", menuItem.context)
        gen.writeEndObject()
      case menuItem: RowViewPortMenuItem =>
        gen.writeStartObject()
        gen.writeStringField("name", menuItem.name)
        gen.writeStringField("filter", menuItem.filter)
        gen.writeStringField("rpcName", menuItem.rpcName)
        gen.writeStringField("context", menuItem.context)
        gen.writeEndObject()
      case menuItem: TableViewPortMenuItem =>
        gen.writeStartObject()
        gen.writeStringField("name", menuItem.name)
        gen.writeStringField("filter", menuItem.filter)
        gen.writeStringField("rpcName", menuItem.rpcName)
        gen.writeStringField("context", menuItem.context)
        gen.writeEndObject()
    }
  }
}

class ViewPortMenuDeserializer extends JsonDeserializer[ViewPortMenu] {

  override def deserialize(jsonParser: JsonParser, deserializationContext: DeserializationContext): ViewPortMenu = {
    val node: JsonNode = jsonParser.getCodec.readTree(jsonParser)
    processJsonNode(node)
  }

  def processJsonNode(node: JsonNode): ViewPortMenu = {
    val name = node.get("name").asText()

    if (name.isEmpty) {
      EmptyViewPortMenu
    }
    else if (node.has("menus")) {
      val menusAsJsonObj = IteratorHasAsScala(node.withArray("menus").asInstanceOf[JsonNode].elements()).asScala.toList
      val childMenus = menusAsJsonObj.map(processJsonNode)
      new ViewPortMenuFolder(name, childMenus)
    }
    else {
      val context = node.get("context").asText()
      val filter = node.get("filter").asText()
      val rpcName = node.get("rpcName").asText()
      context match {
        case "selected-rows" => new SelectionViewPortMenuItem(name, filter, (s, r) => NoAction(), rpcName)
        case "row" => new RowViewPortMenuItem(name, filter, (s, m, r) => NoAction(), rpcName)
        case "grid" => new TableViewPortMenuItem(name, filter, (r) => NoAction(), rpcName)
        case "cell" => new CellViewPortMenuItem(name, filter, (s1, s2, o, r) => NoAction(), rpcName)
      }
    }
  }
}
