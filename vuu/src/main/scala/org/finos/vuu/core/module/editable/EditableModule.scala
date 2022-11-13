package org.finos.vuu.core.module.editable

import org.finos.vuu.api.{TableDef, ViewPortDef, VisualLinks}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.provider.RpcProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

class EditableModule extends DefaultModule {

  final val NAME = "EDITABLE"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "editOrders",
          keyField = "ric",
          columns = Columns.fromNames("ric".string(), "description".string(), "bbg".string(), "isin".string(), "currency".string(), "exchange".string(), "lotSize".int()),
          VisualLinks(),
          joinFields = "ric"
        ),
        (table, vs) => new RpcProvider(table),
        // this below...
        (table, provider, _) => {
          ViewPortDef(
            columns = table.getTableDef.columns,
            service = new EditOrdersRpcService(table, provider.asInstanceOf[RpcProvider])
          )
        }
      ).asModule()
  }
}
