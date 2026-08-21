package org.finos.vuu.core.module.editable

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{SessionTableDef, TableDef, TableDefOptions, ViewPortDef}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns

object EditableModule extends DefaultModule {

  final val NAME = "EDITABLE"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "process",
          keyField = "id",
          customColumns = Columns.fromNames("id".string(), "name".string(), "uptime".long(), "status".string()),
          options = TableDefOptions(
            joinFields = List("id")
          )
        ),
        (table, vs) => new ProcessProvider(table),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new ProcessRpcService(tableContainer)
        )
      ).addSessionTable(
      SessionTableDef(
        name = "fixSequenceReset",
        keyField = "process-id",
        customColumns = Columns.fromNames("process-id:String", "sequenceNumber:Int")
      ),
      (table, _, _, tableContainer) => ViewPortDef(
        columns = table.getTableDef.getColumns,
        service = new FixSequenceRpcService
      )
    ).asModule()
  }
}
