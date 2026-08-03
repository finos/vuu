package org.finos.vuu.core.module.notifications

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{Indices, TableDef, TableDefOptions, ViewPortDef, VisualLinks}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.filter.`type`.PermissionFilter
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.viewport.ViewPort

object NotificationModule extends DefaultModule {
  final val NAME = "NOTIFICATIONS"
  final val TABLE_NAME = "notifications"

  def apply(
             providerFunc: (DataTable, AbstractVuuServer) => Provider,
             permissionFunction: (ViewPort, TableContainer) => PermissionFilter,
             viewPortDefFactory: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef,
             additionalColumns: String*)
           (implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    apply(providerFunc, permissionFunction, viewPortDefFactory, additionalColumns.toArray)
  }

  def apply(
             providerFunc: (DataTable, AbstractVuuServer) => Provider,
             permissionFunction: (ViewPort, TableContainer) => PermissionFilter,
             viewPortDefFactory: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef,
             additionalColumns: Array[String])
           (implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = TABLE_NAME,
          keyField = "id",
          customColumns = NotificationsSchema.allFrom(additionalColumns),
          options = TableDefOptions(
            permissionFunction = permissionFunction,
            joinFields = List("id")
          )
        ),
        providerFunc,
        viewPortDefFactory
      )
      .asModule()
  }
}