package io.venuu.vuu.net.http

trait VuuHttp2ServerOptions{
  def allowDirectoryListings: Boolean
  def certPath: String
  def keyPath: String
  def webRoot: String
  def port: Int
  def withSsl(certPath: String, keyPath: String): VuuHttp2ServerOptions
  def withWebRoot(webRoot: String): VuuHttp2ServerOptions
  def withDirectoryListings(allow: Boolean): VuuHttp2ServerOptions
  def withPort(port: Int): VuuHttp2ServerOptions
}

object VuuHttp2ServerOptions{
  def apply(): VuuHttp2ServerOptions = {
    VuuHttp2ServerOptionsImpl(false, "", "", "", 8080, false)
  }
}

case class VuuHttp2ServerOptionsImpl(useSsl : Boolean = false,
                                     certPath: String = "",
                                     keyPath: String = "", webRoot: String = "",
                                     port: Int,
                                     allowDirectoryListings: Boolean) extends VuuHttp2ServerOptions {


  def withPort(port: Int): VuuHttp2ServerOptions = {
    this.copy(port = port)
  }

  def withSsl(certPath: String, keyPath: String): VuuHttp2ServerOptions = {
    this.copy(certPath = certPath, keyPath = keyPath, useSsl = true)
  }

  def withWebRoot(webRoot: String): VuuHttp2ServerOptions = {
    this.copy(webRoot = webRoot)
  }

  override def withDirectoryListings(allow: Boolean): VuuHttp2ServerOptions = {
    this.copy(allowDirectoryListings = allow)
  }
}
