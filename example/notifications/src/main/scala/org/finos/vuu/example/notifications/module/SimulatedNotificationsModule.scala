package org.finos.vuu.example.notifications.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.{DefaultModule, TableDefContainer, ViewServerModule}
import _root_.org.finos.vuu.core.module.notifications.NotificationModule
import org.finos.vuu.example.notifications.provider.SimulatedNotificationsProvider
import org.finos.vuu.core.filter.`type`.PermissionFilter

object SimulatedNotificationsModule extends DefaultModule {
  final val NAME = NotificationModule.NAME

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    // Example permission function: only show notifications where audience == "all" OR audience == currentUser
    val permissionFunc = (viewPort: org.finos.vuu.viewport.ViewPort, _: org.finos.vuu.core.table.TableContainer) => {
      val currentUser = viewPort.user.name
      // We can use PermissionFilter's Set-based Contains matching on the 'audience' column
      PermissionFilter("audience", Set("all", currentUser, "admin", "trader"))
    }

    NotificationModule(
      (table, _) => new SimulatedNotificationsProvider(table),
      permissionFunc,
      "source:String", "priority:Int"
    )
  }
}
