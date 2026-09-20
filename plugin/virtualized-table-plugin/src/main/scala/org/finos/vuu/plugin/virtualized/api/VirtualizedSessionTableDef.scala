package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.{SessionTableDef, TableDefOptions}
import org.finos.vuu.core.table.Column
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.plugin.PluginType
import org.finos.vuu.plugin.virtualized.VirtualizedTablePluginType
import org.finos.vuu.viewport.ViewPort

import java.time.Duration

abstract class VirtualizedSessionTableDef(
                                           override val name: String,
                                           override val keyField: String,
                                           override val options: TableDefOptions,
                                           remoteColumns: Array[VirtualizedSessionTableColumn],
                                           remotePermissionFilterSpecFunction: ViewPort => FilterSpec,
                                           refreshRateMillis: Long
                                         )
  extends SessionTableDef(name, keyField, remoteColumns.map(f => f.asInstanceOf[Column]), options) {

  private val remoteMapping : Map[String, VirtualizedSessionTableColumn] = remoteColumns.map(f => f.name -> f).toMap

  override def pluginType: PluginType = VirtualizedTablePluginType

  def getRemoteTableName: String = name

  def getRemoteKeyField: String = keyField

  def getRemoteColumns: Array[VirtualizedSessionTableColumn] = remoteColumns

  def getRemotePermissionFilterSpecFunction: ViewPort => FilterSpec = remotePermissionFilterSpecFunction

  def getRemoteColumnMapping: Map[String, VirtualizedSessionTableColumn] = remoteMapping

  def getRefreshRateMillis: Long = refreshRateMillis

}

case class SimpleVirtualizedSessionTableDef(
                                             tableName: String,
                                             tableKeyField: String,
                                             remoteColumns: Array[VirtualizedSessionTableColumn],
                                             remotePermissionFilterSpecFunction: ViewPort => FilterSpec = _ => FilterSpec(""),
                                             refreshRate: Duration = Duration.ofMillis(250),
                                             override val options: TableDefOptions = TableDefOptions(),
                                           ) extends VirtualizedSessionTableDef(tableName, tableKeyField, options, remoteColumns, remotePermissionFilterSpecFunction, refreshRate.toMillis)

case class AliasedVirtualizedSessionTableDef(
                                              remoteName: String,
                                              tableName: String,
                                              remoteKeyField: String,
                                              tableKeyField: String,
                                              remoteColumns: Array[VirtualizedSessionTableColumn],
                                              remotePermissionFilterSpecFunction: ViewPort => FilterSpec = _ => FilterSpec(""),
                                              refreshRate: Duration = Duration.ofMillis(250),
                                              override val options: TableDefOptions = TableDefOptions(),
                                            ) extends VirtualizedSessionTableDef(tableName, tableKeyField, options, remoteColumns, remotePermissionFilterSpecFunction, refreshRate.toMillis) {

  override def getRemoteTableName: String = remoteName

  override def getRemoteKeyField: String = remoteKeyField

}