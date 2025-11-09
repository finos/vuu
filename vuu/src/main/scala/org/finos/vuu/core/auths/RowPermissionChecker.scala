package org.finos.vuu.core.auths

import org.finos.vuu.core.table.RowData
import org.finos.vuu.net.FilterSpec

trait RowPermissionChecker {
  
  def filterSpec: FilterSpec
  
}

object RowPermissionChecker {

  def apply(filter: String): RowPermissionChecker = FilterRowPermissionChecker(FilterSpec(filter))
  
  def apply(filterSpec: FilterSpec): RowPermissionChecker = FilterRowPermissionChecker(filterSpec)

}

object AllowAllRowPermissionChecker extends RowPermissionChecker {
  
  override def filterSpec: FilterSpec = FilterSpec("")
  
}

object DenyAllRowPermissionChecker extends RowPermissionChecker {

  override def filterSpec: FilterSpec = FilterSpec("1 = 0")
  
}

case class FilterRowPermissionChecker(filterSpec: FilterSpec) extends RowPermissionChecker {
  
}
