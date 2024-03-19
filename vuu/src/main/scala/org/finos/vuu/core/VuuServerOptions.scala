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

trait VuuWebSocketOptions {
  def wsPort: Int
  def uri: String
  def bindAddress: String
  def wssEnabled: Boolean
  def certPath: String
  def keyPath: String
  def passPhrase: Option[String]
  def withWsPort(port: Int): VuuWebSocketOptions
  def withUri(uri: String): VuuWebSocketOptions
  def withBindAddress(address: String): VuuWebSocketOptions
  def withWss(certPath: String, keyPath: String, passphrase: Option[String] = None): VuuWebSocketOptions
  def withWssDisabled(): VuuWebSocketOptions
}

trait VuuThreadingOptions{
  def withViewPortThreads(threads:Int): VuuThreadingOptions
  def withTreeThreads(threads:Int): VuuThreadingOptions
  def viewportThreads: Int
  def treeThreads: Int
}

case class VuuSecurityOptionsImpl(authenticator: Authenticator, loginTokenValidator: LoginTokenValidator) extends VuuSecurityOptions{
  override def withAuthenticator(authenticator: Authenticator): VuuSecurityOptions = this.copy(authenticator = authenticator)
  override def withLoginValidator(tokenValidator: LoginTokenValidator): VuuSecurityOptions = this.copy(authenticator = authenticator)
}

private case class VuuWebSocketOptionsImpl(wsPort: Int,
                                   uri: String,
                                   bindAddress: String,
                                   wssEnabled: Boolean = true,
                                   certPath: String = "",
                                   keyPath: String = "",
                                   passPhrase: Option[String] = None) extends VuuWebSocketOptions {
  override def withWsPort(port: Int): VuuWebSocketOptions = this.copy(wsPort = port)
  override def withUri(uri: String): VuuWebSocketOptions = this.copy(uri = uri)
  override def withBindAddress(address: String): VuuWebSocketOptions = this.copy(bindAddress = bindAddress)
  override def withWssDisabled(): VuuWebSocketOptions = this.copy(wssEnabled = false)
  override def withWss(certPath: String, keyPath: String, passphrase: Option[String] = None): VuuWebSocketOptions =
    this.copy(wssEnabled = true, certPath = certPath, keyPath = keyPath, passPhrase = passphrase)
}

case class VuuThreadingOptionsImpl(viewPortThreads: Int = 1, treeViewPortThreads: Int = 1) extends VuuThreadingOptions {
  override def withViewPortThreads(threads: Int): VuuThreadingOptions = this.copy(viewPortThreads = threads)
  override def withTreeThreads(threads: Int): VuuThreadingOptions = this.copy(treeViewPortThreads = threads)
  override def viewportThreads: Int = viewPortThreads
  override def treeThreads: Int = treeViewPortThreads
}

case class VuuServerConfig(httpOptions: VuuHttp2ServerOptions = VuuHttp2ServerOptions(), wsOptions: VuuWebSocketOptions = VuuWebSocketOptions(), security: VuuSecurityOptions = VuuSecurityOptions(),
                           threading: VuuThreadingOptions = VuuThreadingOptions(),
                           modules: List[ViewServerModule] = List(),
                           plugins: List[Plugin] = List()) {
  def withModule(module: ViewServerModule): VuuServerConfig = {
    this.copy(modules = modules ++ List(module))
  }
  def withPlugin(plugin: Plugin): VuuServerConfig = {
    this.copy(plugins = plugins ++ List(plugin))
  }
}
