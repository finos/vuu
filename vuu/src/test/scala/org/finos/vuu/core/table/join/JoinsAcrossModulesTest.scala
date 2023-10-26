package org.finos.vuu.core.table.join

import com.typesafe.config.ConfigFactory
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.table.join.modules.{InstrumentTestModule, PriceTestModule, TestJoinModule}
import org.finos.vuu.core.{VuuSecurityOptions, VuuServerConfig, VuuThreadingOptions, VuuWebSocketOptions}
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.{AlwaysHappyLoginValidator, Authenticator, LoggedInTokenValidator}
import org.finos.vuu.net.http.VuuHttp2ServerOptions
import org.finos.vuu.state.MemoryBackedVuiStateStore
import org.finos.vuu.viewport.ViewPortSetup
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class JoinsAcrossModulesTest extends AnyFeatureSpec with Matchers with ViewPortSetup{

  Feature("Check we can join tables across modules when constructing Vuu"){

    Scenario("Joining 2 tables from 2 modules into a third"){

      //implicit val metrics: MetricsProvider = new MetricsProviderImpl
      implicit val clock: Clock = new TestFriendlyClock(1311541200L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val store = new MemoryBackedVuiStateStore()

      lifecycle.autoShutdownHook()

      val authenticator: Authenticator = new AlwaysHappyAuthenticator
      val loginTokenValidator: LoggedInTokenValidator = new LoggedInTokenValidator

      val defaultConfig = ConfigFactory.load()

      val config = VuuServerConfig(
        VuuHttp2ServerOptions()
          //only specify webroot if we want to load the source locally, we'll load it from the jar
          //otherwise
          .withWebRoot("")
          .withSsl("", "")
          //don't leave me on in prod pls....
          .withDirectoryListings(true)
          .withBindAddress("0.0.0.0")
          .withPort(8443),
        VuuWebSocketOptions()
          .withUri("websocket")
          .withWsPort(8090)
          .withWss("", "")
          .withBindAddress("0.0.0.0"),
        VuuSecurityOptions()
          .withAuthenticator(authenticator)
          .withLoginValidator(new AlwaysHappyLoginValidator),
        VuuThreadingOptions()
          .withViewPortThreads(4)
          .withTreeThreads(4)
      ).withModule(InstrumentTestModule())
        .withModule(PriceTestModule())
        .withModule(TestJoinModule())

    }

  }

}
