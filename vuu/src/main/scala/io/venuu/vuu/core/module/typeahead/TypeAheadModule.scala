package io.venuu.vuu.core.module.typeahead

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}

object TypeAheadModule extends DefaultModule {

  final val NAME = "TYPEAHEAD"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addRpcHandler(server => new TypeAheadRpcHandlerImpl(server.tableContainer))
      .asModule()
  }

}
