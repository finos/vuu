package org.finos.vuu.core.module.modulefrommodule

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.{VuuSecurityOptions, VuuServerConfig, VuuThreadingOptions, VuuWebSocketOptions}
import org.finos.vuu.net.{AlwaysHappyLoginValidator, Authenticator, ViewServerMessage}
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ModuleConstructorTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check Syntax when referencing a module from a module") {

    Scenario("Add a module from a module") {

      implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val clock: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      val authenticator = new Authenticator {
        override def authenticator(user: String, password: String): Option[String] = ???
        override def authenticate(user: String, password: String): Option[ViewServerMessage] = ???
      }

      When("we create a config with modules that reference each other")
      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          //only specify webroot if we want to load the source locally, we'll load it from the jar
          //otherwise
          .withWebRoot("webRoot")
          .withSsl("certPath", "keyPath")
          //don't leave me on in prod pls....
          .withDirectoryListings(true)
          .withBindAddress("0.0.0.0")
          .withPort(8443),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWsPort(8090)
          .withWss("certPath", "keyPath")
          .withBindAddress("0.0.0.0"),
        VuuSecurityOptions()
          .withAuthenticator(authenticator)
          .withLoginValidator(new AlwaysHappyLoginValidator),
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