package org.finos.vuu.test

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.test.impl.TestVuuServerImpl
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

abstract class VuuServerTestCase extends AnyFeatureSpec with GivenWhenThen with Matchers {
    def withVuuServer(modules: ViewServerModule*)(block:TestVuuServer => Unit)(implicit clock: Clock, lifecycle: LifecycleContainer, metrics: MetricsProvider): Unit = {

        val vuuServer = new TestVuuServerImpl(modules.toList)(clock, lifecycle, metrics)

        block(vuuServer)
    }
}
