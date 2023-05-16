package org.finos.vuu.core.module.editable

import org.finos.vuu.api.{SessionTableDef, TableDef, ViewPortDef, VisualLinks}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.provider.RpcProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.vui.VuiStateStoreProvider

object EditableModule extends DefaultModule {

  final val NAME = "EDITABLE"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "process",
          keyField = "id",
          columns = Columns.fromNames("id".string(), "name".string(), "uptime".long(), "status".string()),
          VisualLinks(),
          joinFields = "id"
        ),
        (table, vs) => new ProcessProvider(table),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new ProcessRpcService(tableContainer)
        )
      ).addSessionTable(
      SessionTableDef(
        name = "fixSequenceReset",
        keyField = "process-id",
        columns = Columns.fromNames("process-id:String", "sequenceNumber:Long")
      ),
      (table, _, _, _) => ViewPortDef(
        columns = table.getTableDef.columns,
        service = new FixSequenceRpcService()
      )
    ).asModule()
  }
}
