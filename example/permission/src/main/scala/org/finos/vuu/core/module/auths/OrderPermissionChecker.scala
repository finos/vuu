package org.finos.vuu.core.module.auths

import org.finos.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.filter.`type`.PermissionFilter
import org.finos.vuu.core.module.auths.PermissionModule.ColumnNames.Bitmask
import org.finos.vuu.core.table.{RowData, RowWithData, TableContainer, TablePrimaryKeys}
import org.finos.vuu.viewport.{RowSource, ViewPort}

class OrderPermissionChecker(val vp: ViewPort, tableContainer: TableContainer)(using lifecycle: LifecycleContainer, clock: Clock)
  extends DefaultLifecycleEnabled with PermissionFilter {

  private val reloadPermissionsThread = new LifeCycleRunner("reloadPermissions", runOnce, minCycleTime = 5_000)
  private val permissionTable = tableContainer.getTable("permission")
  private val filter = PermissionFilter(f => canSeeRow(f))
  @volatile private var permissionUserMask = PermissionSet.NoPermissions

  lifecycle(this).dependsOn(reloadPermissionsThread)
  reloadPermissionsThread.doStart()

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

  override def hashCode(): Int = {
      37 * vp.id.hashCode + permissionUserMask
  }

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    filter.doFilter(source, primaryKeys, firstInChain)
  }

  private def canSeeRow(row: RowData): Boolean = {
    val mask = row.get("mask").asInstanceOf[Int]
    PermissionSet.hasRole(permissionUserMask, mask)
  }

}
