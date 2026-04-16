package org.finos.vuu.net.ssl

sealed trait VuuSSLOptions { }

object VuuSSLDisabled extends VuuSSLOptions

case class VuuSSLByCertAndKey(certPath: String,
                              keyPath: String,
                              passPhrase: Option[String] = None,
                              cipherSuite: VuuSSLCipherSuiteOptions = VuuSSLCipherSuiteOptions()) extends VuuSSLOptions

case class VuuSSLByPKCS(pkcsPath: String,
                        pkcsPassword: String,
                        cipherSuite: VuuSSLCipherSuiteOptions = VuuSSLCipherSuiteOptions()) extends VuuSSLOptions

