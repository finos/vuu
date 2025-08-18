package org.finos.vuu.core.module.auths.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.auths.PermissionModule.ColumnNames
import org.finos.vuu.core.module.auths.PermissionSet
import org.finos.vuu.core.table.{DataTable, EmptyRowData, RowWithData}
import org.finos.vuu.net.ClientSessionContainer
import org.finos.vuu.provider.Provider

class PermissionsProvider(val table: DataTable, val sessionsContainer: ClientSessionContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends Provider {

  private val runner = new LifeCycleRunner("PermissionsProvider", () => runOnce(), minCycleTime = 10_000)

  lifecycleContainer(this).dependsOn(runner)

  def runOnce(): Unit = {

    import ColumnNames._

    sessionsContainer.getSessions().foreach( session => {

      table.pullRow(session.user) match {
        case EmptyRowData => table.processUpdate(session.user, RowWithData(session.user,
          Map(User -> session.user, Bitmask -> PermissionSet.NoPermissions, BitmaskAsString -> PermissionSet.toBinaryString(PermissionSet.NoPermissions), BitmaskAsRoles -> PermissionSet.rolesToString(PermissionSet.NoPermissions))))
        case row: RowWithData =>
//          if(!table.hasChanged(row)){
//
//          }

          val newData = row.data ++ Map(BitmaskAsString ->  PermissionSet.toBinaryString(row.get(Bitmask).asInstanceOf[Int]),  BitmaskAsRoles -> PermissionSet.rolesToString(row.get(Bitmask).asInstanceOf[Int]))
          table.processUpdate(session.user, RowWithData(session.user, newData))
      }

    })
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = getClass.getSimpleName + "@" + hashCode()
}
