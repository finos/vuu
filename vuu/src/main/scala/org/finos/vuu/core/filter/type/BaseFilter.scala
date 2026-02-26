package org.finos.vuu.core.filter.`type`

import org.finos.vuu.core.filter.{CompoundFilter, ViewPortFilter}
import org.finos.vuu.core.table.TablePrimaryKeys
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

sealed trait BaseFilter extends ViewPortFilter { }

object BaseFilter {
  
  def apply(permissionFilter: PermissionFilter, frozenTime: Option[EpochTimestamp]): BaseFilter = {
    frozenTime match {
      case Some(value) => PermissionAndFrozenTimeFilter(permissionFilter, value)
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

private case class PermissionAndFrozenTimeFilter(permissionFilter: PermissionFilter, frozenTime: EpochTimestamp) extends BaseFilter {

  private val internalFilter = CompoundFilter(permissionFilter, FrozenTimeFilter(frozenTime))

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys,
                        vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    internalFilter.doFilter(source, primaryKeys, firstInChain)
  }

}



