package org.finos.vuu.api

import org.finos.vuu.api.TableVisibility.Public
import org.finos.vuu.core.filter.`type`.{AllowAllPermissionFilter, PermissionFilter}
import org.finos.vuu.core.table.{RangeSettings, TableContainer}
import org.finos.vuu.net.SortSpec
import org.finos.vuu.viewport.ViewPort

trait TableDefOptions {

  def joinFields: Seq[String]

  def autoSubscribe: Boolean

  def links: VisualLinks

  def indices: Indices

  def visibility: TableVisibility

  def includeDefaultColumns: Boolean

  def isEditable: Boolean

  def permissionFunction: (ViewPort, TableContainer) => PermissionFilter

  def defaultSort: SortSpec

  def rangeSettings: RangeSettings

  def withJoinFields(joinFields: Seq[String]): TableDefOptions

  def withAutoSubscribe(autoSubscribe: Boolean): TableDefOptions

  def withLinks(links: VisualLinks): TableDefOptions

  def withIndices(indices: Indices): TableDefOptions

  def withVisibility(visibility: TableVisibility): TableDefOptions

  def withIncludeDefaultColumns(includeDefaultColumns: Boolean): TableDefOptions

  def withIsEditable(isEditable: Boolean): TableDefOptions

  def withPermissionFunction(permissionFunction: (ViewPort, TableContainer) => PermissionFilter): TableDefOptions

  def withDefaultSort(defaultSort: SortSpec): TableDefOptions

  def withRangeSettings(rangeSettings: RangeSettings): TableDefOptions

}

object TableDefOptions {

  def apply(): TableDefOptions = {
    TableDefOptionsImpl(
      joinFields = Seq.empty,
      autoSubscribe = false,
      links = VisualLinks(),
      indices = Indices(),
      visibility = Public,
      includeDefaultColumns = true,
      isEditable = false,
      permissionFunction = (_, _) => AllowAllPermissionFilter,
      defaultSort = SortSpec(List.empty),
      rangeSettings = RangeSettings()
    )
  }

  def apply(joinFields: Seq[String] = Seq.empty,
            autoSubscribe: Boolean = false,
            links: VisualLinks = VisualLinks(),
            indices: Indices = Indices(),
            visibility: TableVisibility = Public,
            includeDefaultColumns: Boolean = true,
            isEditable: Boolean = false,
            permissionFunction: (ViewPort, TableContainer) => PermissionFilter = (_, _) => AllowAllPermissionFilter,
            defaultSort: SortSpec = SortSpec(List.empty),
            rangeSettings: RangeSettings = RangeSettings()
           ): TableDefOptions = {
    TableDefOptionsImpl(
      joinFields, autoSubscribe,
      links, indices, visibility, includeDefaultColumns, isEditable,
      permissionFunction, defaultSort, rangeSettings
    )
  }

}

case class TableDefOptionsImpl(joinFields: Seq[String],
                               autoSubscribe: Boolean,
                               links: VisualLinks,
                               indices: Indices,
                               visibility: TableVisibility,
                               includeDefaultColumns: Boolean,
                               isEditable: Boolean,
                               permissionFunction: (ViewPort, TableContainer) => PermissionFilter,
                               defaultSort: SortSpec,
                               rangeSettings: RangeSettings
                              ) extends TableDefOptions {

  override def withJoinFields(joinFields: Seq[String]): TableDefOptions =
    copy(joinFields = joinFields)

  override def withAutoSubscribe(autoSubscribe: Boolean): TableDefOptions =
    copy(autoSubscribe = autoSubscribe)

  override def withLinks(links: VisualLinks): TableDefOptions =
    copy(links = links)

  override def withIndices(indices: Indices): TableDefOptions =
    copy(indices = indices)

  override def withVisibility(visibility: TableVisibility): TableDefOptions =
    copy(visibility = visibility)

  override def withIncludeDefaultColumns(includeDefaultColumns: Boolean): TableDefOptions =
    copy(includeDefaultColumns = includeDefaultColumns)

  override def withIsEditable(isEditable: Boolean): TableDefOptions =
    copy(isEditable = isEditable)

  override def withPermissionFunction(permissionFunction: (ViewPort, TableContainer) => PermissionFilter): TableDefOptions =
    copy(permissionFunction = permissionFunction)

  override def withDefaultSort(defaultSort: SortSpec): TableDefOptions =
    copy(defaultSort = defaultSort)

  override def withRangeSettings(rangeSettings: RangeSettings): TableDefOptions =
    copy(rangeSettings = rangeSettings)

}
