package org.finos.vuu.net.http

import org.finos.vuu.core.{VuuSSLByCertAndKey, VuuSSLCipherSuiteOptions, VuuSSLDisabled, VuuSSLOptions}
import org.finos.vuu.net.{Authenticator, LoginTokenValidator}

trait VuuSecurityOptions {
  def authenticator: Authenticator
  def loginTokenValidator: LoginTokenValidator
  def withAuthenticator(authenticator: Authenticator): VuuSecurityOptions
  def withLoginValidator(tokenValidator: LoginTokenValidator): VuuSecurityOptions
}

sealed trait VuuHttp2ServerWebRootType
case class WebRootDisabled() extends VuuHttp2ServerWebRootType
case class ClassPathWebRoot() extends VuuHttp2ServerWebRootType
case class AbsolutePathWebRoot(path: String, directoryListings: Boolean = false) extends VuuHttp2ServerWebRootType

trait VuuHttp2ServerOptions {
  def sslOptions: VuuSSLOptions
  def webRoot: VuuHttp2ServerWebRootType
  def port: Int
  def bindAddress: String
  @deprecated
  def withSsl(certPath: String, keyPath: String): VuuHttp2ServerOptions
  @deprecated
  def withSslDisabled(): VuuHttp2ServerOptions
  def withSsl(vuuSSLOptions: VuuSSLOptions): VuuHttp2ServerOptions
  def withWebRoot(webRoot: VuuHttp2ServerWebRootType): VuuHttp2ServerOptions
  def withPort(port: Int): VuuHttp2ServerOptions
  def withBindAddress(bindAddress: String): VuuHttp2ServerOptions
}

object VuuHttp2ServerOptions {
  def apply(): VuuHttp2ServerOptions = {
    VuuHttp2ServerOptionsImpl(port = 8080)
  }
}

private case class VuuHttp2ServerOptionsImpl(sslOptions: VuuSSLOptions = VuuSSLDisabled(),
                                             webRoot: VuuHttp2ServerWebRootType = WebRootDisabled(),
                                             port: Int,
                                             bindAddress: String = "") extends VuuHttp2ServerOptions {

  def withPort(port: Int): VuuHttp2ServerOptions = {
    this.copy(port = port)
  }

  override def withSslDisabled(): VuuHttp2ServerOptions = this.withSsl(VuuSSLDisabled())

  def withSsl(certPath: String, keyPath: String): VuuHttp2ServerOptions = {
    this.withSsl(VuuSSLByCertAndKey(certPath, keyPath, None, VuuSSLCipherSuiteOptions()))
  }

  def withSsl(sslOptions: VuuSSLOptions): VuuHttp2ServerOptions = {
    this.copy(sslOptions = sslOptions)
  }

  def withWebRoot(webRoot: VuuHttp2ServerWebRootType): VuuHttp2ServerOptions = {
    this.copy(webRoot = webRoot)
  }

  override def withBindAddress(bindAddress: String): VuuHttp2ServerOptions = this.copy(bindAddress = bindAddress)
}
