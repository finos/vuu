package org.finos.vuu.client

import org.finos.vuu.net.ssl.{VuuClientSSLDisabled, VuuClientSSLOptions}

import java.net.URI

trait VuuClientOptions {

  def host: String
  def port: Int
  def path: String
  def sslOptions: VuuClientSSLOptions
  def compressionEnabled: Boolean
  def nativeTransportEnabled: Boolean
  def withHost(host: String): VuuClientOptions
  def withPort(port: Int): VuuClientOptions
  def withPath(path: String): VuuClientOptions
  def withSsl(SSLOptions: VuuClientSSLOptions): VuuClientOptions
  def withSslDisabled(): VuuClientOptions
  def withCompression(withCompression: Boolean): VuuClientOptions
  def withNativeTransport(withNativeTransport: Boolean): VuuClientOptions

  def buildUri(): URI = {
    val protocol = sslOptions match {
      case VuuClientSSLDisabled => "ws"
      case _ => "wss"
    }
    URI.create(s"$protocol://$host:$port/$path")
  }
}

object VuuClientOptions {
  
  def apply(): VuuClientOptions = { 
    VuuClientOptionsImpl(
      host = "localhost",
      port = 8090, 
      path = "websocket",
      sslOptions = VuuClientSSLDisabled, 
      compressionEnabled = true, 
      nativeTransportEnabled = true
    )
  }
  
}

private case class VuuClientOptionsImpl(host: String,
                                port: Int,
                                path: String,
                                sslOptions: VuuClientSSLOptions,
                                compressionEnabled: Boolean,
                                nativeTransportEnabled: Boolean) extends VuuClientOptions {

  override def withHost(host: String): VuuClientOptions = this.copy(host = host)

  override def withPort(port: Int): VuuClientOptions = this.copy(port = port)

  override def withPath(path: String): VuuClientOptions = this.copy(path = path)

  override def withSsl(sslOptions: VuuClientSSLOptions): VuuClientOptions = this.copy(sslOptions = sslOptions)

  override def withSslDisabled(): VuuClientOptions = this.copy(sslOptions = VuuClientSSLDisabled)

  override def withNativeTransport(nativeTransportEnabled: Boolean): VuuClientOptions = this.copy(nativeTransportEnabled = nativeTransportEnabled)

  override def withCompression(compressionEnabled: Boolean): VuuClientOptions = this.copy(compressionEnabled = compressionEnabled)

}


