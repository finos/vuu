package org.finos.vuu.core.module.auths

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.table.{Column, RowData}
import org.finos.vuu.viewport.ViewPort

class TestFriendlyPermissionChecker(val viewPort: ViewPort) extends RowPermissionChecker with StrictLogging{

  @volatile var permissions: Int = PermissionSet.NoPermissions
  val column: Column = viewPort.getColumns.getColumnForName("ownerMask").get

  def addRole(mask: Int): Unit = {
    permissions = PermissionSet.addRole(permissions, mask)
    logger.info(s"AUTHS: added mask $mask permissions $permissions")
  }

  def removeRole(mask: Int): Unit = {
    permissions = PermissionSet.removeRole(permissions, mask)
    logger.info(s"AUTHS: removed mask $mask permissions $permissions")
  }

  override def canSeeRow(row: RowData): Boolean = {
    val ownerMask = row.get(column).asInstanceOf[Int]
    PermissionSet.hasRole(permissions, ownerMask)
  }

  override def hashCode(): Int = permissions.hashCode()
}
