package org.finos.vuu.core.module.auths

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef, VisualLinks}
import org.finos.vuu.core.module.auths.provider.PermissionsProvider
import org.finos.vuu.core.module.auths.service.PermissionsRpcService
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns

object PermissionModule extends DefaultModule{

  private final val NAME = "AUTHS"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    import ColumnNames._

  ModuleFactory.withNamespace(NAME)
    .addTable(
      TableDef(
        name = "permission",
        keyField = User,
        columns = Columns.fromNames(User.string(), Bitmask.long(), BitmaskAsString.string(), BitmaskAsRoles.string()),
        VisualLinks(),
        joinFields = User
      ),
      (table, vs) => new PermissionsProvider(table, vs.sessionContainer),
      (table, _, _, tableContainer) => ViewPortDef(
        columns = table.getTableDef.columns,
        service = new PermissionsRpcService(table)(tableContainer)
      )
    ).asModule()

  }

  object ColumnNames{
    final val User = "user"
    final val Bitmask = "bitmask"
    final val BitmaskAsString = "bitmaskAsString"
    final val BitmaskAsRoles = "bitmaskAsRoles"
  }

}
