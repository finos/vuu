package io.venuu.vuu.core.module.editable

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.{TableDef, ViewPortDef, VisualLinks}
import io.venuu.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import io.venuu.vuu.core.table.Columns
import io.venuu.vuu.provider.RpcProvider

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
        (table, provider, _ ) => {
          ViewPortDef(
            columns = table.getTableDef.columns,
            service = new EditOrdersRpcService(table, provider.asInstanceOf[RpcProvider])
          )
        }
      ).asModule()
  }
}
