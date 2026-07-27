package org.finos.vuu.example.notifications.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.{DefaultModule, TableDefContainer, ViewServerModule}
import _root_.org.finos.vuu.core.module.notifications.NotificationModule
import org.finos.vuu.example.notifications.provider.SimulatedNotificationsProvider

object SimulatedNotificationsModule extends DefaultModule {
  final val NAME = NotificationModule.NAME

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    NotificationModule((table, _) => new SimulatedNotificationsProvider(table), "source:String", "priority:Int")
  }
}
