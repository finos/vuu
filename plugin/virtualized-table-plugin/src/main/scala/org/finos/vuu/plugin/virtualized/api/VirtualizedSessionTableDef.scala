package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.{Indices, SessionTableDef, VisualLinks}
import org.finos.vuu.core.table.Column
import org.finos.vuu.plugin.PluginType
import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType

case class VirtualizedSessionTableDef (override val name: String, override val keyField: String,
                                       override val columns: Array[Column],
                                       override val indices: Indices = Indices()) extends SessionTableDef(name, keyField, columns, Seq(), false, VisualLinks(), indices){

  override def pluginType: PluginType = VirtualizedTablePluginType
}
