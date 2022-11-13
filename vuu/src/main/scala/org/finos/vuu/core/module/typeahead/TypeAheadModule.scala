package org.finos.vuu.core.module.typeahead

import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

object TypeAheadModule extends DefaultModule {

  final val NAME = "TYPEAHEAD"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addRpcHandler(server => new TypeAheadRpcHandlerImpl(server.tableContainer))
      .asModule()
  }

}
