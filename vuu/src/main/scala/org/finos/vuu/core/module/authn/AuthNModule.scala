package org.finos.vuu.core.module.authn

import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.net.{Authenticator, LoggedInTokenValidator}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

object AuthNModule extends DefaultModule {

  final val NAME = "authn"

  def apply(authenticator: Authenticator, tokenValidator: LoggedInTokenValidator)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addRestService(_ => new AuthNRestService(authenticator, tokenValidator))
      .asModule()
  }

}
