package org.finos.vuu.net.ssl

sealed trait VuuClientSSLOptions { }

object VuuClientSSLDisabled extends VuuClientSSLOptions

case class VuuClientSSL(cipherSuite: VuuSSLCipherSuiteOptions = VuuSSLCipherSuiteOptions()) extends VuuClientSSLOptions

case class VuuClientSSLWithTrustStore(trustStorePath: String,
                                      trustStorePassword: String,
                                      trustStoreType: String,
                                      cipherSuite: VuuSSLCipherSuiteOptions = VuuSSLCipherSuiteOptions()) extends VuuClientSSLOptions