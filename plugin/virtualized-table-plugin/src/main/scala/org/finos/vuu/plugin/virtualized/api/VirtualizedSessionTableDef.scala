package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.SessionTableDef
import org.finos.vuu.core.table.Column
import org.finos.vuu.plugin.PluginType
import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType
import org.finos.vuu.plugin.virtualized.table.range.{NoRangeOptions, RangeOptions}

abstract class VirtualizedSessionTableDef(
                                           name: String,
                                           keyField: String,
                                           remoteColumns: Array[VirtualizedSessionTableColumn],
                                           rangeOptions: RangeOptions = NoRangeOptions,
                                           includeDefaults: Boolean = false,
                                         ) extends SessionTableDef(name, keyField, remoteColumns.map(f => f.asInstanceOf[Column]), includeDefaultColumns = includeDefaults) {

  override def pluginType: PluginType = VirtualizedTablePluginType

  def getRemoteTableName: String = name

  def getRemoteKeyField: String = keyField

  def getRemoteColumns: Array[VirtualizedSessionTableColumn] = remoteColumns

  def getRangeOptions: RangeOptions = rangeOptions

}

case class SimpleVirtualizedSessionTableDef(
                                             tableName: String,
                                             tableKeyField: String,
                                             remoteColumns: Array[VirtualizedSessionTableColumn],
                                             rangeOptions: RangeOptions = NoRangeOptions,
                                             includeDefaults: Boolean = false
                                           ) extends VirtualizedSessionTableDef(tableName, tableKeyField, remoteColumns, rangeOptions, includeDefaults)

case class AliasedVirtualizedSessionTableDef(
                                              remoteName: String,
                                              tableName: String,
                                              remoteKeyField: String,
                                              tableKeyField: String,
                                              remoteColumns: Array[VirtualizedSessionTableColumn],
                                              rangeOptions: RangeOptions = NoRangeOptions,
                                              includeDefaults: Boolean = false
                                            ) extends VirtualizedSessionTableDef(tableName, tableKeyField, remoteColumns, rangeOptions, includeDefaults) {

  override def getRemoteTableName: String = remoteName

  override def getRemoteKeyField: String = remoteKeyField

}