package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.{SessionTableDef, TableDefOptions}
import org.finos.vuu.core.table.Column
import org.finos.vuu.plugin.PluginType
import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType

abstract class VirtualizedSessionTableDef(
                                           override val name: String,
                                           override val keyField: String,
                                           override val options: TableDefOptions,
                                           remoteColumns: Array[VirtualizedSessionTableColumn])
  extends SessionTableDef(name, keyField, remoteColumns.map(f => f.asInstanceOf[Column]), options) {

  override def pluginType: PluginType = VirtualizedTablePluginType

  def getRemoteTableName: String = name

  def getRemoteKeyField: String = keyField

  def getRemoteColumns: Array[VirtualizedSessionTableColumn] = remoteColumns

}

case class SimpleVirtualizedSessionTableDef(
                                             tableName: String,
                                             tableKeyField: String,
                                             remoteColumns: Array[VirtualizedSessionTableColumn],
                                             override val options: TableDefOptions = TableDefOptions(),
                                           ) extends VirtualizedSessionTableDef(tableName, tableKeyField, options, remoteColumns)

case class AliasedVirtualizedSessionTableDef(
                                              remoteName: String,
                                              tableName: String,
                                              remoteKeyField: String,
                                              tableKeyField: String,
                                              remoteColumns: Array[VirtualizedSessionTableColumn],
                                              override val options: TableDefOptions = TableDefOptions(),
                                            ) extends VirtualizedSessionTableDef(tableName, tableKeyField, options, remoteColumns) {

  override def getRemoteTableName: String = remoteName

  override def getRemoteKeyField: String = remoteKeyField

}