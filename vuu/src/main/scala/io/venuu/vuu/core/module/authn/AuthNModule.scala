package io.venuu.vuu.core.module.authn

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import io.venuu.vuu.net.{Authenticator, LoggedInTokenValidator}

object AuthNModule extends DefaultModule {

  final val NAME = "authn"

  def apply(authenticator: Authenticator, tokenValidator: LoggedInTokenValidator)(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addRestService(_ => new AuthNRestService(authenticator, tokenValidator))
      .asModule()
  }

}
