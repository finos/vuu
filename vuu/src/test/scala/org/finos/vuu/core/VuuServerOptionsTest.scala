package org.finos.vuu.core

import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.http.NoHttpServerFactory
import org.finos.vuu.net.ssl.VuuSSLDisabled
import org.finos.vuu.plugin.Plugin
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

import java.time.Duration

class VuuServerOptionsTest extends AnyFeatureSpec with Matchers with MockitoSugar {

  Feature("VuuSecurityOptions configuration and updates") {

    Scenario("Default security options initialize with a login token service") {
      val options = VuuSecurityOptions()
      options.loginTokenService should not be null
    }

    Scenario("Updating login token service returns a new instance with the updated service") {
      val customService = LoginTokenService()
      val options = VuuSecurityOptions().withLoginTokenService(customService)
      options.loginTokenService shouldBe customService
    }
  }

  Feature("VuuWebSocketOptions default values and fluent builders") {
    Scenario("Default websocket options have correct sensible defaults") {
      val options = VuuWebSocketOptions()
      options.wsPort shouldBe 8090
      options.uri shouldBe "/websocket"
      options.bindAddress shouldBe "0.0.0.0"
      options.sslOptions shouldBe VuuSSLDisabled
      options.compressionEnabled shouldBe true
      options.nativeTransportEnabled shouldBe true
      options.maxSessionsPerUser shouldBe 1
      options.maxContentLength shouldBe 262144
      options.clientIdleTimeout shouldBe Duration.ofSeconds(20)
    }

    Scenario("All fluent builder methods correctly update their respective fields") {
      val newTimeout = Duration.ofSeconds(45)
      val options = VuuWebSocketOptions()
        .withWsPort(9090)
        .withUri("/custom-ws")
        .withBindAddress("127.0.0.1")
        .withCompression(withCompression = false)
        .withNativeTransport(withNativeTransport = false)
        .withMaxSessionsPerUser(5)
        .withMaxContentLength(524288)
        .withClientIdleTimeout(newTimeout)

      options.wsPort shouldBe 9090
      options.uri shouldBe "/custom-ws"
      options.bindAddress shouldBe "127.0.0.1"
      options.compressionEnabled shouldBe false
      options.nativeTransportEnabled shouldBe false
      options.maxSessionsPerUser shouldBe 5
      options.maxContentLength shouldBe 524288
      options.clientIdleTimeout shouldBe newTimeout
    }
  }

  Feature("VuuThreadingOptions threading thread count configurations") {
    Scenario("Default threading options have correct thread counts") {
      val options = VuuThreadingOptions()
      options.viewportThreads shouldBe 1
      options.treeThreads shouldBe 1
    }

    Scenario("Fluent setters correctly update viewport and tree thread counts") {
      val options = VuuThreadingOptions()
        .withViewPortThreads(4)
        .withTreeThreads(2)

      options.viewportThreads shouldBe 4
      options.treeThreads shouldBe 2
    }
  }

  Feature("VuuClientConnectionOptions heartbeat configurations") {
    Scenario("Default client connection options enable heartbeat") {
      val options = VuuClientConnectionOptions()
      options.hasHeartbeat shouldBe true
    }

    Scenario("Heartbeat can be explicitly enabled or disabled") {
      val disabled = VuuClientConnectionOptions().withHeartbeatDisabled()
      disabled.hasHeartbeat shouldBe false

      val enabled = disabled.withHeartbeatEnabled()
      enabled.hasHeartbeat shouldBe true
    }
  }

  Feature("VuuJoinTableProviderOptions batch size and queue depth settings") {
    Scenario("Default join table provider options have standard limits") {
      val options = VuuJoinTableProviderOptions()
      options.batchSize shouldBe 16384
      options.maxQueueSize shouldBe 32768
    }

    Scenario("Batch size and max queue depth setters update correctly") {
      val options = VuuJoinTableProviderOptions()
        .withBatchSize(8192)
        .withMaxQueueDepth(16384)

      options.batchSize shouldBe 8192
      options.maxQueueSize shouldBe 16384
    }
  }

  Feature("VuuRpcOptions session table size limits") {
    Scenario("Default RPC options have standard table size") {
      val options = VuuRpcOptions()
      options.maxSessionTableSize shouldBe 10000
    }

    Scenario("Max session table size setter updates correctly") {
      val options = VuuRpcOptions().withMaxSessionTableSize(25000)
      options.maxSessionTableSize shouldBe 25000
    }
  }

  Feature("VuuServerConfig top-level container and module/plugin aggregation") {
    Scenario("Default server config initializes all sub-options and empty lists") {
      val config = VuuServerConfig()
      config.webSocketOptions should not be null
      config.securityOptions should not be null
      config.threadingOptions should not be null
      config.clientConnectionOptions should not be null
      config.joinTableProviderOptions should not be null
      config.rpcOptions should not be null
      config.modules shouldBe empty
      config.plugins shouldBe empty
      config.httpServerFactory shouldBe NoHttpServerFactory
    }

    Scenario("Registering single and multiple modules correctly aggregates them in the configuration") {
      val mockModuleA = mock[ViewServerModule]
      val mockModuleB = mock[ViewServerModule]

      val config = VuuServerConfig()
        .withModule(mockModuleA)
        .withModules(List(mockModuleB))

      config.modules should contain theSameElementsAs List(mockModuleA, mockModuleB)
    }

    Scenario("Registering single and multiple plugins correctly aggregates them in the configuration") {
      val mockPluginA = mock[Plugin]
      val mockPluginB = mock[Plugin]

      val config = VuuServerConfig()
        .withPlugin(mockPluginA)
        .withPlugins(List(mockPluginB))

      config.plugins should contain theSameElementsAs List(mockPluginA, mockPluginB)
    }


  }


}
