package org.finos.vuu.net.ssl

import org.finos.vuu.core.VuuSSLCipherSuiteOptionsImpl

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

private case class VuuSSLCipherSuiteOptionsImpl(ciphers: List[String], 
                                                protocols: List[String]) extends VuuSSLCipherSuiteOptions {
  override def withCiphers(ciphers: List[String]): VuuSSLCipherSuiteOptions = this.copy(ciphers = ciphers)
  override def withProtocols(protocols: List[String]): VuuSSLCipherSuiteOptions = this.copy(protocols = protocols)
}

