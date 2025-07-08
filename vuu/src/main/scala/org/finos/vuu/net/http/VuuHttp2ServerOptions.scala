package org.finos.vuu.net.http

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
case class AbsolutePathWebRoot(path: String, directoryListings: Boolean) extends VuuHttp2ServerWebRootType

trait VuuHttp2ServerOptions {
  def sslEnabled: Boolean
  def certPath: String
  def keyPath: String
  def webRoot: VuuHttp2ServerWebRootType
  def port: Int
  def bindAddress: String
  def withSsl(certPath: String, keyPath: String): VuuHttp2ServerOptions
  def withSslDisabled(): VuuHttp2ServerOptions
  def withWebRoot(webRoot: VuuHttp2ServerWebRootType): VuuHttp2ServerOptions
  def withPort(port: Int): VuuHttp2ServerOptions
  def withBindAddress(bindAddress: String): VuuHttp2ServerOptions
}

object VuuHttp2ServerOptions {
  def apply(): VuuHttp2ServerOptions = {
    VuuHttp2ServerOptionsImpl(port = 8080)
  }
}

private case class VuuHttp2ServerOptionsImpl(sslEnabled: Boolean = true,
                                             certPath: String = "", keyPath: String = "",
                                             webRoot: VuuHttp2ServerWebRootType = WebRootDisabled(), port: Int,
                                             bindAddress: String = "") extends VuuHttp2ServerOptions {

  def withPort(port: Int): VuuHttp2ServerOptions = {
    this.copy(port = port)
  }

  override def withSslDisabled(): VuuHttp2ServerOptions = this.copy(sslEnabled = false)

  def withSsl(certPath: String, keyPath: String): VuuHttp2ServerOptions = {
    this.copy(certPath = certPath, keyPath = keyPath, sslEnabled = true)
  }

  def withWebRoot(webRoot: VuuHttp2ServerWebRootType): VuuHttp2ServerOptions = {
    this.copy(webRoot = webRoot)
  }

  override def withBindAddress(bindAddress: String): VuuHttp2ServerOptions = this.copy(bindAddress = bindAddress)
}
