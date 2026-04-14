package org.finos.vuu.client

sealed trait VuuClientSSLOptions { }

object VuuClientSSLDisabled extends VuuClientSSLOptions

object VuuClientSSLByDefaultTruststore extends VuuClientSSLOptions

case class VuuClientSSLByTrustStore(trustStorePath: String, trustStorePassword: String) extends VuuClientSSLOptions