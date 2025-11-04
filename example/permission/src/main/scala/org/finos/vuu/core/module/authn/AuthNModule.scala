package org.finos.vuu.core.module.authn

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.net.auth.LoginTokenService

object AuthNModule extends DefaultModule {

  final val NAME = "authn"

  def apply(loginTokenService: LoginTokenService, users: Option[java.util.Set[String]] = None)
           (implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addRestService(_ => new AuthNRestService(loginTokenService, users))
      .asModule()
  }

}
