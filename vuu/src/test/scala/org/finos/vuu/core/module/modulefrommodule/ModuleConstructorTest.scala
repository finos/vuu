package org.finos.vuu.core.module.modulefrommodule

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.{VuuSecurityOptions, VuuServerConfig, VuuThreadingOptions, VuuWebSocketOptions}
import org.finos.vuu.net.auth.Authenticator
import org.finos.vuu.net.ssl.VuuSSLByCertAndKey
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ModuleConstructorTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check Syntax when referencing a module from a module") {

    Scenario("Add a module from a module") {

      implicit val clock: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      When("we create a config with modules that reference each other")
      val config = VuuServerConfig(
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWsPort(8090)
          .withSsl(VuuSSLByCertAndKey("certPath", "keyPath"))
          .withBindAddress("0.0.0.0"),
        VuuSecurityOptions(),
        VuuThreadingOptions()
          .withViewPortThreads(1)
          .withTreeThreads(1)
      ).withModule(InstrumentModule())
        .withModule(PriceModule())
        .withModule(JoinModule())

      Then("we should be able to resolve the modules as long as they are defined in order")
      config.modules.head.tableDefContainer.getModuleCount shouldEqual(3)
    }
  }
}