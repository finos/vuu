package org.finos.vuu.provider

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

object JoinTableProviderImpl {

  def apply()(implicit timeProvider: Clock, lifecycle: LifecycleContainer, metrics: MetricsProvider): JoinTableProvider = {
    new VuuJoinTableProvider()
  }

}
