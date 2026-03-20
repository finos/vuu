package org.finos.vuu.http2.server.config

import org.finos.vuu.core.{VuuSSLDisabled, VuuSSLOptions}

trait VuuHttp2ServerOptions {

  def sslOptions: VuuSSLOptions

  def webRoot: HttpServerWebRootType

  def port: Int

  def withSslDisabled(): VuuHttp2ServerOptions

  def withSsl(vuuSSLOptions: VuuSSLOptions): VuuHttp2ServerOptions

  def withWebRoot(webRoot: HttpServerWebRootType): VuuHttp2ServerOptions

  def withPort(port: Int): VuuHttp2ServerOptions

}

object VuuHttp2ServerOptions {
  def apply(): VuuHttp2ServerOptions = {
    VuuHttp2ServerOptionsImpl(port = 0)
  }
}

private case class VuuHttp2ServerOptionsImpl(sslOptions: VuuSSLOptions = VuuSSLDisabled,
                                             webRoot: HttpServerWebRootType = WebRootDisabled,
                                             port: Int) extends VuuHttp2ServerOptions {

  def withPort(port: Int): VuuHttp2ServerOptions = {
    this.copy(port = port)
  }

  override def withSslDisabled(): VuuHttp2ServerOptions = this.withSsl(VuuSSLDisabled)

  def withSsl(sslOptions: VuuSSLOptions): VuuHttp2ServerOptions = {
    this.copy(sslOptions = sslOptions)
  }

  def withWebRoot(webRoot: HttpServerWebRootType): VuuHttp2ServerOptions = {
    this.copy(webRoot = webRoot)
  }

}
