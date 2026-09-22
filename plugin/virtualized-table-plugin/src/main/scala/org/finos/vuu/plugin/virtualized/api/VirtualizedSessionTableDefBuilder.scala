package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.TableDefOptions
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.viewport.ViewPort

import java.time.Duration
import scala.collection.mutable.ArrayBuffer

class VirtualizedSessionTableDefBuilder private (
                                                  private var tableNameOpt: Option[String] = None,
                                                  private var tableKeyFieldOpt: Option[String] = None,
                                                  private var remoteNameOpt: Option[String] = None,
                                                  private var remoteKeyFieldOpt: Option[String] = None,
                                                  private var columnsBuffer: ArrayBuffer[VirtualizedSessionTableColumn] = ArrayBuffer.empty,
                                                  private var filterSpecFunc: ViewPort => FilterSpec = _ => FilterSpec(""),
                                                  private var refreshRateDuration: Duration = Duration.ofMillis(250),
                                                  private var tableOptions: TableDefOptions = TableDefOptions()
                                                ) {

  def withTableName(name: String): VirtualizedSessionTableDefBuilder = {
    this.tableNameOpt = Some(name)
    this
  }

  def withTableKeyField(keyField: String): VirtualizedSessionTableDefBuilder = {
    this.tableKeyFieldOpt = Some(keyField)
    this
  }

  def withRemoteName(remoteName: String): VirtualizedSessionTableDefBuilder = {
    this.remoteNameOpt = Some(remoteName)
    this
  }

  def withRemoteKeyField(remoteKeyField: String): VirtualizedSessionTableDefBuilder = {
    this.remoteKeyFieldOpt = Some(remoteKeyField)
    this
  }

  def withColumns(cols: Array[VirtualizedSessionTableColumn]): VirtualizedSessionTableDefBuilder = {
    this.columnsBuffer = ArrayBuffer.from(cols)
    this
  }

  def withColumns(cols: Seq[VirtualizedSessionTableColumn]): VirtualizedSessionTableDefBuilder = {
    this.columnsBuffer = ArrayBuffer.from(cols)
    this
  }

  def addColumn(column: VirtualizedSessionTableColumn): VirtualizedSessionTableDefBuilder = {
    this.columnsBuffer += column
    this
  }

  def addColumns(cols: VirtualizedSessionTableColumn*): VirtualizedSessionTableDefBuilder = {
    this.columnsBuffer ++= cols
    this
  }

  def withPermissionFilterSpec(fn: ViewPort => FilterSpec): VirtualizedSessionTableDefBuilder = {
    this.filterSpecFunc = fn
    this
  }

  def withRefreshRate(duration: Duration): VirtualizedSessionTableDefBuilder = {
    this.refreshRateDuration = duration
    this
  }

  def withOptions(options: TableDefOptions): VirtualizedSessionTableDefBuilder = {
    this.tableOptions = options
    this
  }

  def build(): VirtualizedSessionTableDef = {
    val tableName = requireTableName()
    val tableKeyField = requireTableKeyField()

    (remoteNameOpt, remoteKeyFieldOpt) match {
      case (Some(rName), Some(rKey)) if rName != tableName || rKey != tableKeyField =>
        buildAliasedInternal(rName, rKey)
      case (Some(rName), None) if rName != tableName =>
        buildAliasedInternal(rName, tableKeyField)
      case (None, Some(rKey)) if rKey != tableKeyField =>
        buildAliasedInternal(tableName, rKey)
      case _ =>
        buildSimpleInternal()
    }
  }

  def buildSimple(): SimpleVirtualizedSessionTableDef = buildSimpleInternal()

  def buildAliased(): AliasedVirtualizedSessionTableDef = {
    val rName = remoteNameOpt.getOrElse(requireTableName())
    val rKey = remoteKeyFieldOpt.getOrElse(requireTableKeyField())
    buildAliasedInternal(rName, rKey)
  }

  private def buildSimpleInternal(): SimpleVirtualizedSessionTableDef = {
    SimpleVirtualizedSessionTableDef(
      tableName = requireTableName(),
      tableKeyField = requireTableKeyField(),
      remoteColumns = columnsBuffer.toArray,
      remotePermissionFilterSpecFunction = filterSpecFunc,
      refreshRate = refreshRateDuration,
      options = tableOptions
    )
  }

  private def buildAliasedInternal(remoteName: String, remoteKeyField: String): AliasedVirtualizedSessionTableDef = {
    AliasedVirtualizedSessionTableDef(
      remoteName = remoteName,
      tableName = requireTableName(),
      remoteKeyField = remoteKeyField,
      tableKeyField = requireTableKeyField(),
      remoteColumns = columnsBuffer.toArray,
      remotePermissionFilterSpecFunction = filterSpecFunc,
      refreshRate = refreshRateDuration,
      options = tableOptions
    )
  }

  private def requireTableName(): String =
    tableNameOpt.getOrElse(throw new IllegalArgumentException("tableName is required"))

  private def requireTableKeyField(): String =
    tableKeyFieldOpt.getOrElse(throw new IllegalArgumentException("tableKeyField is required"))
}

object VirtualizedSessionTableDefBuilder {
  def apply(): VirtualizedSessionTableDefBuilder = new VirtualizedSessionTableDefBuilder()
}