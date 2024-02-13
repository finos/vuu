package org.finos.vuu.core.module.typeahead

import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

object TypeAheadModule extends DefaultModule {

  final val NAME = "TYPEAHEAD"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addRpcHandler(server => new GenericTypeAheadRpcHandler(server.tableContainer))
      .asModule()
  }

}
