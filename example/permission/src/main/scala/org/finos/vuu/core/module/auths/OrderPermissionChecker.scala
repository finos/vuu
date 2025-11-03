package org.finos.vuu.core.module.auths

import org.finos.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.module.auths.PermissionModule.ColumnNames.Bitmask
import org.finos.vuu.core.table.{RowData, RowWithData, TableContainer}
import org.finos.vuu.viewport.ViewPort

class OrderPermissionChecker(val vp: ViewPort, tableContainer: TableContainer)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultLifecycleEnabled with RowPermissionChecker {

  val reloadPermissionsThread = new LifeCycleRunner("reloadPermissions", runOnce, minCycleTime = 5_000)

  lifecycle(this).dependsOn(reloadPermissionsThread)

  reloadPermissionsThread.doStart()

  private val permissionTable = tableContainer.getTable("permission")
  @volatile private var permissionUserMask = PermissionSet.NoPermissions

  def runOnce(): Unit = {
    val user = vp.user.name
    permissionUserMask = permissionTable.asTable.pullRow(user) match {
      case row: RowWithData =>
        row.get(Bitmask).asInstanceOf[Int]
      case _ =>
        PermissionSet.NoPermissions
    }
  }


  override def doStart(): Unit = {
    reloadPermissionsThread.doStart()
  }

  override def doStop(): Unit = {
    reloadPermissionsThread.doStop()
  }

  override def canSeeRow(row: RowData): Boolean = {
    val mask = row.get("mask").asInstanceOf[Int]
    PermissionSet.hasRole(permissionUserMask, mask)
  }

  override def hashCode(): Int = {
      37 * vp.id.hashCode + permissionUserMask
  }
}
