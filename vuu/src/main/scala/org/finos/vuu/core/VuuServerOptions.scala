package org.finos.vuu.core

import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.net.auth.AlwaysHappyAuthenticator
import org.finos.vuu.net.http.{VuuHttp2ServerOptions, VuuSecurityOptions}
import org.finos.vuu.net.{AlwaysHappyLoginValidator, Authenticator, LoginTokenValidator}
import org.finos.vuu.plugin.Plugin

object VuuSecurityOptions{
  def apply(): VuuSecurityOptions = {
    VuuSecurityOptionsImpl(new AlwaysHappyAuthenticator, new AlwaysHappyLoginValidator)
  }
}

object VuuWebSocketOptions {
  def apply(): VuuWebSocketOptions = {
    VuuWebSocketOptionsImpl(8090, "/websocket", "0.0.0.0")
  }
}

object VuuThreadingOptions {
  def apply(): VuuThreadingOptions = {
    VuuThreadingOptionsImpl(1, 1)
  }
}

object VuuClientConnectionOptions {
  def apply(): VuuClientConnectionOptions = {
    VuuClientConnectionOptionsImpl(true)
  }
}

object VuuJoinTableProviderOptions {
  def apply() : VuuJoinTableProviderOptions = {
    VuuJoinProviderOptionsImpl.apply(batchSize = 100, maxQueueSize = 20_000)
  }
}

trait VuuSSLCipherSuiteOptions {
  def ciphers: List[String]
  def protocols: List[String]
  def withCiphers(ciphers: List[String]) : VuuSSLCipherSuiteOptions
  def withProtocols(protocols: List[String]) : VuuSSLCipherSuiteOptions
}

object VuuSSLCipherSuiteOptions {
  def apply(): VuuSSLCipherSuiteOptions = {
    VuuSSLCipherSuiteOptionsImpl(List(), List())
  }
}

sealed trait VuuSSLOptions
case class VuuSSLDisabled() extends VuuSSLOptions
case class VuuSSLByCertAndKey(certPath: String, keyPath: String, passPhrase: Option[String] = None, cipherSuite: VuuSSLCipherSuiteOptions = VuuSSLCipherSuiteOptions()) extends VuuSSLOptions
case class VuuSSLByPKCS(pkcsPath: String, pkcsPassword: String, cipherSuite: VuuSSLCipherSuiteOptions = VuuSSLCipherSuiteOptions()) extends VuuSSLOptions

trait VuuWebSocketOptions {
  def wsPort: Int
  def uri: String
  def bindAddress: String
  def sslOptions: VuuSSLOptions
  def withWsPort(port: Int): VuuWebSocketOptions
  def withUri(uri: String): VuuWebSocketOptions
  def withBindAddress(address: String): VuuWebSocketOptions
  def withSslDisabled(): VuuWebSocketOptions
  def withSsl(vuuSSLOptions: VuuSSLOptions): VuuWebSocketOptions
}

trait VuuThreadingOptions{
  def withViewPortThreads(threads:Int): VuuThreadingOptions
  def withTreeThreads(threads:Int): VuuThreadingOptions
  def viewportThreads: Int
  def treeThreads: Int
}

trait VuuClientConnectionOptions {
  def hasHeartbeat: Boolean
  def withHeartbeat(): VuuClientConnectionOptions
  def withHeartbeatDisabled(): VuuClientConnectionOptions
}

trait VuuJoinTableProviderOptions {
  def batchSize: Int
  def maxQueueSize: Int
  def withBatchSize(maxQueueDepth: Int): VuuJoinTableProviderOptions
  def withMaxQueueDepth(maxQueueDepth: Int): VuuJoinTableProviderOptions
}

case class VuuSecurityOptionsImpl(authenticator: Authenticator, loginTokenValidator: LoginTokenValidator) extends VuuSecurityOptions{
  override def withAuthenticator(authenticator: Authenticator): VuuSecurityOptions = this.copy(authenticator = authenticator)
  override def withLoginValidator(tokenValidator: LoginTokenValidator): VuuSecurityOptions = this.copy(loginTokenValidator = tokenValidator)
}

private case class VuuWebSocketOptionsImpl(wsPort: Int,
                                   uri: String,
                                   bindAddress: String,
                                   sslOptions: VuuSSLOptions = VuuSSLDisabled()
                                   ) extends VuuWebSocketOptions {
  override def withWsPort(port: Int): VuuWebSocketOptions = this.copy(wsPort = port)
  override def withUri(uri: String): VuuWebSocketOptions = this.copy(uri = uri)
  override def withBindAddress(address: String): VuuWebSocketOptions = this.copy(bindAddress = bindAddress)
  override def withSslDisabled(): VuuWebSocketOptions = this.withSsl(VuuSSLDisabled())
  override def withSsl(sslOptions: VuuSSLOptions): VuuWebSocketOptions =
    this.copy(sslOptions = sslOptions)
}

case class VuuThreadingOptionsImpl(viewPortThreads: Int = 1, treeViewPortThreads: Int = 1) extends VuuThreadingOptions {
  override def withViewPortThreads(threads: Int): VuuThreadingOptions = this.copy(viewPortThreads = threads)
  override def withTreeThreads(threads: Int): VuuThreadingOptions = this.copy(treeViewPortThreads = threads)
  override def viewportThreads: Int = viewPortThreads
  override def treeThreads: Int = treeViewPortThreads
}

case class VuuClientConnectionOptionsImpl(hasHeartbeat: Boolean) extends VuuClientConnectionOptions {
  override def withHeartbeat(): VuuClientConnectionOptions = this.copy(true)
  override def withHeartbeatDisabled(): VuuClientConnectionOptions = this.copy(false)
}

case class VuuSSLCipherSuiteOptionsImpl(ciphers: List[String], protocols: List[String]) extends VuuSSLCipherSuiteOptions {
  override def withCiphers(ciphers: List[String]): VuuSSLCipherSuiteOptions = this.copy(ciphers = ciphers)
  override def withProtocols(protocols: List[String]): VuuSSLCipherSuiteOptions = this.copy(protocols = protocols)
}

case class VuuJoinProviderOptionsImpl(batchSize: Int, maxQueueSize: Int) extends VuuJoinTableProviderOptions {
  override def withBatchSize(batchSize: Int): VuuJoinTableProviderOptions = this.copy(batchSize = batchSize)
  override def withMaxQueueDepth(maxQueueSize: Int): VuuJoinTableProviderOptions = this.copy(maxQueueSize = maxQueueSize)
}

case class VuuServerConfig(httpOptions: VuuHttp2ServerOptions = VuuHttp2ServerOptions(),
                           wsOptions: VuuWebSocketOptions = VuuWebSocketOptions(),
                           security: VuuSecurityOptions = VuuSecurityOptions(),
                           threading: VuuThreadingOptions = VuuThreadingOptions(),
                           clientConnection: VuuClientConnectionOptions = VuuClientConnectionOptions(),
                           joinProvider: VuuJoinTableProviderOptions = VuuJoinTableProviderOptions(),
                           modules: List[ViewServerModule] = List(),
                           plugins: List[Plugin] = List()) {
  def withModule(module: ViewServerModule): VuuServerConfig = {
    this.copy(modules = modules ++ List(module))
  }
  def withPlugin(plugin: Plugin): VuuServerConfig = {
    this.copy(plugins = plugins ++ List(plugin))
  }
}
