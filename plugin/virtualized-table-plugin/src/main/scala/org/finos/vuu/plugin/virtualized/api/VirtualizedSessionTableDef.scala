package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.core.table.Column
import org.finos.vuu.plugin.PluginType
import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType
import org.finos.vuu.plugin.virtualized.table.VirtualizedTableColumn

abstract class VirtualizedSessionTableDef(
                                           name: String,
                                           keyField: String,
                                           remoteColumns: Array[VirtualizedTableColumn],
                                           includeDefaultColumns: Boolean = false,
                                         ) extends SessionTableDef(name, keyField, remoteColumns.map(f => f.asInstanceOf[Column])) {

  override def pluginType: PluginType = VirtualizedTablePluginType

  def getRemoteTableName: String = name

}

case class SimpleVirtualizedSessionTableDef(
                                             override val name: String,
                                             override val keyField: String,
                                             remoteColumns: Array[VirtualizedTableColumn]
                                           ) extends VirtualizedSessionTableDef(name, keyField, remoteColumns)

case class AliasedVirtualizedSessionTableDef(
                                              remoteName: String,
                                              override val name: String,
                                              override val keyField: String,
                                              remoteColumns: Array[VirtualizedTableColumn]
                                            ) extends VirtualizedSessionTableDef(name, keyField, remoteColumns) {

  override def getRemoteTableName: String = remoteName

}