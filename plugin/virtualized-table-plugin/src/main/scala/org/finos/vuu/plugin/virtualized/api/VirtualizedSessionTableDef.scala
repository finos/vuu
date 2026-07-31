package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.{SessionTableDef, TableDefOptions}
import org.finos.vuu.core.table.Column
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.plugin.PluginType
import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType
import org.finos.vuu.viewport.ViewPort

abstract class VirtualizedSessionTableDef(
                                           override val name: String,
                                           override val keyField: String,
                                           override val options: TableDefOptions,
                                           remoteColumns: Array[VirtualizedSessionTableColumn],
                                           remotePermissionFilterSpecFunction: ViewPort => FilterSpec
                                         )
  extends SessionTableDef(name, keyField, remoteColumns.map(f => f.asInstanceOf[Column]), options) {

  override def pluginType: PluginType = VirtualizedTablePluginType

  def getRemoteTableName: String = name

  def getRemoteKeyField: String = keyField

  def getRemoteColumns: Array[VirtualizedSessionTableColumn] = remoteColumns

  def getRemotePermissionFilterSpecFunction: ViewPort => FilterSpec = remotePermissionFilterSpecFunction

}

case class SimpleVirtualizedSessionTableDef(
                                             tableName: String,
                                             tableKeyField: String,
                                             remoteColumns: Array[VirtualizedSessionTableColumn],
                                             remotePermissionFilterSpecFunction: ViewPort => FilterSpec = _ => FilterSpec(""),
                                             override val options: TableDefOptions = TableDefOptions(),
                                           ) extends VirtualizedSessionTableDef(tableName, tableKeyField, options, remoteColumns, remotePermissionFilterSpecFunction)

case class AliasedVirtualizedSessionTableDef(
                                              remoteName: String,
                                              tableName: String,
                                              remoteKeyField: String,
                                              tableKeyField: String,
                                              remoteColumns: Array[VirtualizedSessionTableColumn],
                                              remotePermissionFilterSpecFunction: ViewPort => FilterSpec = _ => FilterSpec(""),
                                              override val options: TableDefOptions = TableDefOptions(),
                                            ) extends VirtualizedSessionTableDef(tableName, tableKeyField, options, remoteColumns, remotePermissionFilterSpecFunction) {

  override def getRemoteTableName: String = remoteName

  override def getRemoteKeyField: String = remoteKeyField

}