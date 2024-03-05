package org.finos.vuu.net.http

import org.finos.vuu.net.{Authenticator, LoginTokenValidator}

trait VuuSecurityOptions {
  def authenticator: Authenticator
  def loginTokenValidator: LoginTokenValidator
  def withAuthenticator(authenticator: Authenticator): VuuSecurityOptions
  def withLoginValidator(tokenValidator: LoginTokenValidator): VuuSecurityOptions
}

trait VuuHttp2ServerOptions {
  def allowDirectoryListings: Boolean
  def sslEnabled: Boolean
  def certPath: String
  def keyPath: String
  def webRoot: String
  def port: Int
  def bindAddress: String
  def withSsl(certPath: String, keyPath: String): VuuHttp2ServerOptions
  def withWebRoot(webRoot: String): VuuHttp2ServerOptions
  def withDirectoryListings(allow: Boolean): VuuHttp2ServerOptions
  def withPort(port: Int): VuuHttp2ServerOptions
  def withBindAddress(bindAddress: String): VuuHttp2ServerOptions
}

object VuuHttp2ServerOptions {
  def apply(): VuuHttp2ServerOptions = {
    VuuHttp2ServerOptionsImpl(false, "", "", "", 8080, false)
  }
}

case class VuuHttp2ServerOptionsImpl(sslEnabled: Boolean = false,
                                     certPath: String = "",
                                     keyPath: String = "", webRoot: String = "",
                                     port: Int,
                                     allowDirectoryListings: Boolean, bindAddress: String = "") extends VuuHttp2ServerOptions {

  def withPort(port: Int): VuuHttp2ServerOptions = {
    this.copy(port = port)
  }

  def withSsl(certPath: String, keyPath: String): VuuHttp2ServerOptions = {
    this.copy(certPath = certPath, keyPath = keyPath, sslEnabled = true)
  }

  def withWebRoot(webRoot: String): VuuHttp2ServerOptions = {
    this.copy(webRoot = webRoot)
  }

  override def withDirectoryListings(allow: Boolean): VuuHttp2ServerOptions = {
    this.copy(allowDirectoryListings = allow)
  }
  override def withBindAddress(bindAddress: String): VuuHttp2ServerOptions = this.copy(bindAddress = bindAddress)
}
