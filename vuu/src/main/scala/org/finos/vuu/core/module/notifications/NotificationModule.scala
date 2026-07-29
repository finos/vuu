package org.finos.vuu.core.module.notifications

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{Indices, TableDef, VisualLinks}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport.ViewPort
import org.finos.vuu.core.filter.`type`.{AllowAllPermissionFilter, PermissionFilter}

object NotificationModule extends DefaultModule {
  final val NAME = "NOTIFICATIONS"
  final val TABLE_NAME = "notifications"

  def apply(providerFunc: (DataTable, AbstractVuuServer) => Provider, permissionFunction: (ViewPort, TableContainer) => PermissionFilter, additionalColumns: String*)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = TABLE_NAME,
          keyField = "id",
          columns = NotificationsSchema.allFrom(additionalColumns: _*),
          VisualLinks(),
          Indices(),
          permissionFunction = permissionFunction,
          joinFields = "id"
        ),
        providerFunc
      )
      .asModule()
  }

  def apply(providerFunc: (DataTable, AbstractVuuServer) => Provider, permissionFunction: (ViewPort, TableContainer) => PermissionFilter, additionalColumns: Array[String])(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    apply(providerFunc, permissionFunction, additionalColumns: _*)
  }
}

