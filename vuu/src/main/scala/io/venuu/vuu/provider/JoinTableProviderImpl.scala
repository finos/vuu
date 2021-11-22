package io.venuu.vuu.provider

import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock

object JoinTableProviderImpl {

  def apply()(implicit timeProvider: Clock, lifecyle: LifecycleContainer, metrics: MetricsProvider): JoinTableProvider = {
    new VuuJoinTableProvider()
  }

}
