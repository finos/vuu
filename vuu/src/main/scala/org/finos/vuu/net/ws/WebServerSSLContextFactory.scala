package org.finos.vuu.net.ws

import io.netty.handler.ssl.{SslContext, SslContextBuilder}
import org.finos.vuu.core.{VuuSSLByCertAndKey, VuuSSLByPKCS, VuuSSLCipherSuite, VuuSSLDisabled, VuuSSLOptions}
import org.finos.vuu.util.PathChecker

import java.io.{File, FileInputStream}
import java.security.KeyStore
import javax.net.ssl.KeyManagerFactory
import scala.jdk.CollectionConverters.IterableHasAsJava
import scala.util.Using

class WebServerSSLContextFactory {

  def buildContext(vuuSSLOptions: VuuSSLOptions) : Option[SslContext] = {
    vuuSSLOptions match {
      case VuuSSLDisabled() => Option.empty
      case VuuSSLByCertAndKey(certPath, keyPath, passPhrase, cipherSuite) => Option(createCertAndKeyContext(certPath, keyPath, passPhrase, cipherSuite))
      case VuuSSLByPKCS(pkcsPath, pkcsPassword, cipherSuite) => Option(createPKCSContext(pkcsPath, pkcsPassword, cipherSuite))
    }
  }

  private def createPKCSContext(pkcsPath: String, pkcsPassword: String, cipherSuite: Option[VuuSSLCipherSuite]): SslContext = {
    PathChecker.throwOnFileNotExists(pkcsPath, "vuu.pkcsPath, doesn't appear to exist")
    val keyStore = KeyStore.getInstance("PKCS12")
    Using(new FileInputStream(pkcsPath)) {
      reader => keyStore.load(reader, pkcsPassword.toCharArray)
    }
    val keyManagerFactory = KeyManagerFactory.getInstance("SunX509")
    keyManagerFactory.init(keyStore, pkcsPassword.toCharArray)
    applyCipherSuite(SslContextBuilder.forServer(keyManagerFactory), cipherSuite)
  }

  private def createCertAndKeyContext(certPath: String, keyPath: String, passPhrase: Option[String], cipherSuite: Option[VuuSSLCipherSuite]): SslContext = {
    PathChecker.throwOnFileNotExists(certPath, "vuu.certPath, doesn't appear to exist")
    PathChecker.throwOnFileNotExists(keyPath, "vuu.keyPath, doesn't appear to exist")
    passPhrase match {
      case Some(passPhrase) =>
        applyCipherSuite(SslContextBuilder.forServer(new File(certPath), new File(keyPath), passPhrase), cipherSuite)
      case None =>
        applyCipherSuite(SslContextBuilder.forServer(new File(certPath), new File(keyPath)), cipherSuite)
    }
  }

  private def applyCipherSuite(sslContextBuilder: SslContextBuilder, cipherSuite: Option[VuuSSLCipherSuite]): SslContext = {
    cipherSuite match {
      case None => sslContextBuilder.build()
      case Some(cipherSuite) =>
        sslContextBuilder
          .ciphers(cipherSuite.ciphers.asJava)
          .protocols(cipherSuite.protocols.asJava)
          .build()
    }
  }

}
