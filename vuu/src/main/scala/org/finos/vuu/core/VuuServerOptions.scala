package org.finos.vuu.core

import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.net.auth.LoginTokenService
import org.finos.vuu.net.http.{HttpServerFactory, NoHttpServerFactory}
import org.finos.vuu.net.ssl.{VuuSSLDisabled, VuuSSLOptions}
import org.finos.vuu.plugin.Plugin

import java.time.Duration

trait VuuSecurityOptions {
  def loginTokenService: LoginTokenService

  def withLoginTokenService(tokenValidator: LoginTokenService): VuuSecurityOptions
}

object VuuSecurityOptions {
  def apply(): VuuSecurityOptions = {
    VuuSecurityOptionsImpl(LoginTokenService())
  }
}

object VuuWebSocketOptions {
  def apply(): VuuWebSocketOptions = {
    VuuWebSocketOptionsImpl(
      wsPort = 8090,
      uri = "/websocket",
      bindAddress = "0.0.0.0",
      sslOptions = VuuSSLDisabled,
      compressionEnabled = true,
      nativeTransportEnabled = true,
      maxSessionsPerUser = 1,
      maxContentLength = 262_144, //256KB
      clientIdleTimeout = Duration.ofSeconds(20)
    )
  }
}

object VuuThreadingOptions {
  def apply(): VuuThreadingOptions = {
    VuuThreadingOptionsImpl(
      viewPortThreads = 1,
      treeViewPortThreads = 1
    )
  }
}

object VuuClientConnectionOptions {
  def apply(): VuuClientConnectionOptions = {
    VuuClientConnectionOptionsImpl(true)
  }
}

object VuuJoinTableProviderOptions {
  def apply(): VuuJoinTableProviderOptions = {
    VuuJoinProviderOptionsImpl.apply(batchSize = 16_384, maxQueueSize = 32_768)
  }
}

object VuuRpcOptions {
  def apply(): VuuRpcOptions = {
    VuuRpcOptionsImpl.apply(maxSessionTableSize = 10_000)
  }
}

trait VuuWebSocketOptions {
  def wsPort: Int

  def uri: String

  def bindAddress: String

  def sslOptions: VuuSSLOptions

  def compressionEnabled: Boolean

  def nativeTransportEnabled: Boolean

  def clientIdleTimeout: Duration

  def maxContentLength: Int

  def maxSessionsPerUser: Int

  def withWsPort(port: Int): VuuWebSocketOptions

  def withUri(uri: String): VuuWebSocketOptions

  def withBindAddress(address: String): VuuWebSocketOptions

  def withSslDisabled(): VuuWebSocketOptions

  def withSsl(vuuSSLOptions: VuuSSLOptions): VuuWebSocketOptions

  def withCompression(withCompression: Boolean): VuuWebSocketOptions

  def withNativeTransport(withNativeTransport: Boolean): VuuWebSocketOptions

  def withMaxSessionsPerUser(maxSessionsPerUser: Int): VuuWebSocketOptions

  def withMaxContentLength(maxContentLength: Int): VuuWebSocketOptions

  def withClientIdleTimeout(clientIdleTimeout: Duration): VuuWebSocketOptions
}

trait VuuThreadingOptions {
  def withViewPortThreads(threads: Int): VuuThreadingOptions

  def withTreeThreads(threads: Int): VuuThreadingOptions

  def viewportThreads: Int

  def treeThreads: Int
}

trait VuuClientConnectionOptions {
  def hasHeartbeat: Boolean

  def withHeartbeat(hasHeartbeat: Boolean): VuuClientConnectionOptions

  def withHeartbeatEnabled(): VuuClientConnectionOptions

  def withHeartbeatDisabled(): VuuClientConnectionOptions
}

trait VuuJoinTableProviderOptions {
  def batchSize: Int

  def maxQueueSize: Int

  def withBatchSize(maxQueueDepth: Int): VuuJoinTableProviderOptions

  def withMaxQueueDepth(maxQueueDepth: Int): VuuJoinTableProviderOptions
}

trait VuuRpcOptions {
  def maxSessionTableSize: Int

  def withMaxSessionTableSize(maxSessionTableSize: Int): VuuRpcOptions
}

trait VuuServerConfig {
  def webSocketOptions: VuuWebSocketOptions

  def securityOptions: VuuSecurityOptions

  def threadingOptions: VuuThreadingOptions

  def clientConnectionOptions: VuuClientConnectionOptions

  def joinTableProviderOptions: VuuJoinTableProviderOptions

  def rpcOptions: VuuRpcOptions

  def modules: List[ViewServerModule]

  def plugins: List[Plugin]

  def httpServerFactory: HttpServerFactory

  def withWebSocketOptions(webSocketOptions: VuuWebSocketOptions): VuuServerConfig

  def withSecurityOptions(securityOptions: VuuSecurityOptions): VuuServerConfig

  def withThreadingOptions(threadingOptions: VuuThreadingOptions): VuuServerConfig

  def withClientConnectionOptions(clientConnectionOptions: VuuClientConnectionOptions): VuuServerConfig

  def withJoinTableProviderOptions(joinTableProviderOptions: VuuJoinTableProviderOptions): VuuServerConfig

  def withRpcOptions(rpcOptions: VuuRpcOptions): VuuServerConfig

  def withModules(modules: List[ViewServerModule]): VuuServerConfig

  def withModule(module: ViewServerModule): VuuServerConfig

  def withPlugins(plugins: List[Plugin]): VuuServerConfig

  def withPlugin(plugin: Plugin): VuuServerConfig

  def withHttpServerFactory(httpServerFactory: HttpServerFactory): VuuServerConfig
}

object VuuServerConfig {

  def apply(): VuuServerConfig = {
    VuuServerConfigImpl(
      webSocketOptions = VuuWebSocketOptions(),
      securityOptions = VuuSecurityOptions(),
      threadingOptions = VuuThreadingOptions(),
      clientConnectionOptions = VuuClientConnectionOptions(),
      joinTableProviderOptions = VuuJoinTableProviderOptions(),
      rpcOptions = VuuRpcOptions(),
      modules = List.empty,
      plugins = List.empty,
      httpServerFactory = NoHttpServerFactory
    )
  }
}

private case class VuuWebSocketOptionsImpl(wsPort: Int,
                                           uri: String,
                                           bindAddress: String,
                                           sslOptions: VuuSSLOptions,
                                           compressionEnabled: Boolean,
                                           nativeTransportEnabled: Boolean,
                                           maxSessionsPerUser: Int,
                                           maxContentLength: Int,
                                           clientIdleTimeout: Duration
                                          ) extends VuuWebSocketOptions {
  override def withWsPort(port: Int): VuuWebSocketOptions = this.copy(wsPort = port)

  override def withUri(uri: String): VuuWebSocketOptions = this.copy(uri = uri)

  override def withBindAddress(address: String): VuuWebSocketOptions = this.copy(bindAddress = bindAddress)

  override def withSslDisabled(): VuuWebSocketOptions = this.withSsl(VuuSSLDisabled)

  override def withSsl(sslOptions: VuuSSLOptions): VuuWebSocketOptions =
    this.copy(sslOptions = sslOptions)

  override def withCompression(compressionEnabled: Boolean): VuuWebSocketOptions =
    this.copy(compressionEnabled = compressionEnabled)

  override def withNativeTransport(nativeTransportEnabled: Boolean): VuuWebSocketOptions =
    this.copy(nativeTransportEnabled = nativeTransportEnabled)

  override def withMaxSessionsPerUser(maxSessionsPerUser: Int): VuuWebSocketOptions =
    this.copy(maxSessionsPerUser = maxSessionsPerUser)

  override def withMaxContentLength(maxContentLength: Int): VuuWebSocketOptions =
    this.copy(maxContentLength = maxContentLength)

  override def withClientIdleTimeout(clientIdleTimeout: Duration): VuuWebSocketOptions =
    this.copy(clientIdleTimeout = clientIdleTimeout)
}

case class VuuThreadingOptionsImpl(viewPortThreads: Int, treeViewPortThreads: Int) extends VuuThreadingOptions {
  override def withViewPortThreads(threads: Int): VuuThreadingOptions = this.copy(viewPortThreads = threads)

  override def withTreeThreads(threads: Int): VuuThreadingOptions = this.copy(treeViewPortThreads = threads)

  override def viewportThreads: Int = viewPortThreads

  override def treeThreads: Int = treeViewPortThreads
}

case class VuuClientConnectionOptionsImpl(hasHeartbeat: Boolean) extends VuuClientConnectionOptions {
  override def withHeartbeat(hasHeartbeat: Boolean): VuuClientConnectionOptions = this.copy(hasHeartbeat = hasHeartbeat)

  override def withHeartbeatEnabled(): VuuClientConnectionOptions = this.copy(true)

  override def withHeartbeatDisabled(): VuuClientConnectionOptions = this.copy(false)
}


case class VuuJoinProviderOptionsImpl(batchSize: Int, maxQueueSize: Int) extends VuuJoinTableProviderOptions {
  override def withBatchSize(batchSize: Int): VuuJoinTableProviderOptions = this.copy(batchSize = batchSize)

  override def withMaxQueueDepth(maxQueueSize: Int): VuuJoinTableProviderOptions = this.copy(maxQueueSize = maxQueueSize)
}

case class VuuRpcOptionsImpl(maxSessionTableSize: Int) extends VuuRpcOptions {
  override def withMaxSessionTableSize(maxSessionTableSize: Int): VuuRpcOptions = this.copy(maxSessionTableSize = maxSessionTableSize)
}

case class VuuSecurityOptionsImpl(loginTokenService: LoginTokenService) extends VuuSecurityOptions {
  override def withLoginTokenService(loginTokenService: LoginTokenService): VuuSecurityOptions =
    this.copy(loginTokenService = loginTokenService)
}

case class VuuServerConfigImpl(webSocketOptions: VuuWebSocketOptions,
                               securityOptions: VuuSecurityOptions,
                               threadingOptions: VuuThreadingOptions,
                               clientConnectionOptions: VuuClientConnectionOptions,
                               joinTableProviderOptions: VuuJoinTableProviderOptions,
                               rpcOptions: VuuRpcOptions,
                               modules: List[ViewServerModule],
                               plugins: List[Plugin],
                               httpServerFactory: HttpServerFactory) extends VuuServerConfig {

  def withWebSocketOptions(webSocketOptions: VuuWebSocketOptions): VuuServerConfig = {
    this.copy(webSocketOptions = webSocketOptions)
  }

  def withSecurityOptions(securityOptions: VuuSecurityOptions): VuuServerConfig = {
    this.copy(securityOptions = securityOptions)
  }

  def withThreadingOptions(threadingOptions: VuuThreadingOptions): VuuServerConfig = {
    this.copy(threadingOptions = threadingOptions)
  }

  def withClientConnectionOptions(clientConnectionOptions: VuuClientConnectionOptions): VuuServerConfig = {
    this.copy(clientConnectionOptions = clientConnectionOptions)
  }

  def withJoinTableProviderOptions(joinTableProviderOptions: VuuJoinTableProviderOptions): VuuServerConfig = {
    this.copy(joinTableProviderOptions = joinTableProviderOptions)
  }

  def withRpcOptions(rpcOptions: VuuRpcOptions): VuuServerConfig = {
    this.copy(joinTableProviderOptions = joinTableProviderOptions)
  }

  def withModule(module: ViewServerModule): VuuServerConfig = {
    this.copy(modules = modules ++ List(module))
  }

  def withModules(modules: List[ViewServerModule]): VuuServerConfig = {
    this.copy(modules = modules)
  }

  def withPlugin(plugin: Plugin): VuuServerConfig = {
    this.copy(plugins = plugins ++ List(plugin))
  }

  def withPlugins(plugins: List[Plugin]): VuuServerConfig = {
    this.copy(plugins = plugins)
  }

  def withHttpServerFactory(httpServerFactory: HttpServerFactory): VuuServerConfig = {
    this.copy(httpServerFactory = httpServerFactory)
  }

}
