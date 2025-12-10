package org.finos.vuu.core.filter.`type`

import org.finos.vuu.core.filter.ViewPortFilter
import org.finos.vuu.core.table.TablePrimaryKeys
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

sealed trait BaseFilter extends ViewPortFilter { }

object BaseFilter {
  
  def apply(permissionFilter: PermissionFilter, frozenTime: Option[EpochTimestamp]): BaseFilter = {
    frozenTime match {
      case Some(value) => PermissionAndFrozenTimeFilter(permissionFilter, FrozenTimeFilter(value))
      case None => OnlyPermissionFilter(permissionFilter)
    }
  }
  
}

private case class OnlyPermissionFilter(permissionFilter: PermissionFilter) extends BaseFilter {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys,
                        vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    permissionFilter.doFilter(source, primaryKeys, firstInChain)
  }

}

private case class PermissionAndFrozenTimeFilter(permissionFilter: PermissionFilter, frozenTimeFilter: FrozenTimeFilter) extends BaseFilter {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    val permissionFiltered = permissionFilter.doFilter(source, primaryKeys, firstInChain)
    val stillFirstInChain = firstInChain && permissionFiltered.length == primaryKeys.length
    frozenTimeFilter.doFilter(source, permissionFiltered, stillFirstInChain)
  }

}



