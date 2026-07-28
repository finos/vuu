package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.core.table.{Column, RangeSettings}
import org.finos.vuu.net.SortSpec
import org.finos.vuu.plugin.PluginType
import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType

abstract class VirtualizedSessionTableDef(
                                           name: String,
                                           keyField: String,
                                           remoteColumns: Array[VirtualizedSessionTableColumn],
                                           rangeSettings: RangeSettings,
                                           defaultSort: SortSpec,
                                           includeDefaults: Boolean,
                                         ) 
  extends SessionTableDef(name, keyField, remoteColumns.map(f => f.asInstanceOf[Column]), rangeSettings = rangeSettings,
    defaultSort = defaultSort, includeDefaultColumns = includeDefaults) {

  override def pluginType: PluginType = VirtualizedTablePluginType

  def getRemoteTableName: String = name

  def getRemoteKeyField: String = keyField

  def getRemoteColumns: Array[VirtualizedSessionTableColumn] = remoteColumns

}

case class SimpleVirtualizedSessionTableDef(
                                             tableName: String,
                                             tableKeyField: String,
                                             remoteColumns: Array[VirtualizedSessionTableColumn],
                                             range: RangeSettings = RangeSettings(),
                                             sort: SortSpec = SortSpec(List.empty),                                             
                                             includeDefaults: Boolean = false                                           
                                           ) extends VirtualizedSessionTableDef(tableName, tableKeyField, remoteColumns, range, sort, includeDefaults)

case class AliasedVirtualizedSessionTableDef(
                                              remoteName: String,
                                              tableName: String,
                                              remoteKeyField: String,
                                              tableKeyField: String,
                                              remoteColumns: Array[VirtualizedSessionTableColumn],
                                              range: RangeSettings = RangeSettings(),
                                              sort: SortSpec = SortSpec(List.empty),
                                              includeDefaults: Boolean = false
                                            ) extends VirtualizedSessionTableDef(tableName, tableKeyField, remoteColumns, range, sort, includeDefaults) {

  override def getRemoteTableName: String = remoteName

  override def getRemoteKeyField: String = remoteKeyField

}