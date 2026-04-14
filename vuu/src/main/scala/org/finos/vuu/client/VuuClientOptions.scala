package org.finos.vuu.client

import org.finos.vuu.core.VuuSSLOptions

trait VuuClientOptions {

  def host: String
  def port: Int 
  def path: String
  def sslOptions: VuuClientSSLOptions
  def compressionEnabled: Boolean
  def nativeTransportEnabled: Boolean
  
}

object VuuClientOptions {
  
  def apply(): VuuClientOptions = { 
    VuuClientOptionsImpl(
      host = "localhost", 
      port = 8090, 
      path = "/websocket",
      sslOptions = VuuClientSSLDisabled, 
      compressionEnabled = true, 
      nativeTransportEnabled = true
    )
  }
  
}

case class VuuClientOptionsImpl(host: String, 
                                port: Int,
                                path: String,
                                sslOptions: VuuClientSSLOptions,
                                compressionEnabled: Boolean,
                                nativeTransportEnabled: Boolean) extends VuuClientOptions {
  
  
  
}


