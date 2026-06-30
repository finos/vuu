package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.core.table.Column
import org.finos.vuu.plugin.PluginType
import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType

abstract class VirtualizedSessionTableDef(
                                           name: String,
                                           keyField: String,
                                           remoteColumns: Array[VirtualizedSessionTableColumn],
                                           includeDefaultColumns: Boolean = false,
                                         ) extends SessionTableDef(name, keyField, remoteColumns.map(f => f.asInstanceOf[Column])) {

  override def pluginType: PluginType = VirtualizedTablePluginType

  def getRemoteTableName: String = name

  def getRemoteKeyField: String = keyField

  def getRemoteColumns: Array[VirtualizedSessionTableColumn] = remoteColumns

}

case class SimpleVirtualizedSessionTableDef(
                                             override val name: String,
                                             override val keyField: String,
                                             remoteColumns: Array[VirtualizedSessionTableColumn]
                                           ) extends VirtualizedSessionTableDef(name, keyField, remoteColumns)

case class AliasedVirtualizedSessionTableDef(
                                              remoteName: String,
                                              override val name: String,
                                              remoteKeyField: String,
                                              override val keyField: String,
                                              remoteColumns: Array[VirtualizedSessionTableColumn]
                                            ) extends VirtualizedSessionTableDef(name, keyField, remoteColumns) {

  override def getRemoteTableName: String = remoteName

  override def getRemoteKeyField: String = remoteKeyField

}