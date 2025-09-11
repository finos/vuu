package org.finos.vuu.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.vuu.core.VuuJoinTableProviderOptions

object JoinTableProviderImpl {

  def apply()(implicit lifecycleContainer: LifecycleContainer): JoinTableProvider = {
    apply(VuuJoinTableProviderOptions())
  }

  def apply(vuuJoinTableProviderOptions: VuuJoinTableProviderOptions)(implicit lifecycle: LifecycleContainer): JoinTableProvider = {
    new VuuJoinTableProvider(vuuJoinTableProviderOptions)
  }

}
