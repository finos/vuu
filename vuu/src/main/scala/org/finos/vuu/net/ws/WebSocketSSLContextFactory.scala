package org.finos.vuu.net.ws

import io.netty.handler.ssl.{SslContext, SslContextBuilder}
import org.finos.vuu.net.ssl.{VuuClientSSL, VuuClientSSLDisabled, VuuClientSSLOptions, VuuClientSSLWithPKCS, VuuSSLByCertAndKey, VuuSSLByPKCS, VuuSSLCipherSuiteOptions, VuuSSLDisabled, VuuSSLOptions}
import org.finos.vuu.util.PathChecker

import java.io.{File, FileInputStream}
import java.security.KeyStore
import javax.net.ssl.{KeyManagerFactory, TrustManagerFactory}
import scala.jdk.CollectionConverters.IterableHasAsJava
import scala.util.Using

object WebSocketSSLContextFactory {

  def buildContext(vuuSSLOptions: VuuSSLOptions) : Option[SslContext] = {
    vuuSSLOptions match {
      case VuuSSLDisabled => Option.empty
      case VuuSSLByCertAndKey(certPath, keyPath, passPhrase, cipherSuite) => Option(createCertAndKeyContext(certPath, keyPath, passPhrase, cipherSuite))
      case VuuSSLByPKCS(pkcsPath, pkcsPassword, cipherSuite) => Option(createPKCSContext(pkcsPath, pkcsPassword, cipherSuite))
    }
  }

  def buildClientContext(vuuClientSSLOptions: VuuClientSSLOptions): Option[SslContext] = {
    vuuClientSSLOptions match {
      case VuuClientSSLDisabled => 
        Option.empty      
      case VuuClientSSL(cipherSuite) => 
        Option(createDefaultClientContext(cipherSuite))
      case VuuClientSSLWithPKCS(pkcsPath, pkcsPassword, cipherSuite) => 
        Option(createPKCSClientContext(pkcsPath, pkcsPassword, cipherSuite))
    }
  }

  private def createPKCSContext(pkcsPath: String, pkcsPassword: String, cipherSuite: VuuSSLCipherSuiteOptions): SslContext = {
    val keyStore = loadKeyStore(pkcsPath, pkcsPassword)
    val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm)
    keyManagerFactory.init(keyStore, pkcsPassword.toCharArray)
    applyCipherSuite(SslContextBuilder.forServer(keyManagerFactory), cipherSuite)
  }

  private def createCertAndKeyContext(certPath: String, keyPath: String, passPhrase: Option[String], cipherSuite: VuuSSLCipherSuiteOptions): SslContext = {
    PathChecker.throwOnFileNotExists(certPath, "vuu.certPath, doesn't appear to exist")
    PathChecker.throwOnFileNotExists(keyPath, "vuu.keyPath, doesn't appear to exist")
    passPhrase match {
      case Some(passPhrase) =>
        applyCipherSuite(SslContextBuilder.forServer(new File(certPath), new File(keyPath), passPhrase), cipherSuite)
      case None =>
        applyCipherSuite(SslContextBuilder.forServer(new File(certPath), new File(keyPath)), cipherSuite)
    }
  }

  private def createDefaultClientContext(cipherSuite: VuuSSLCipherSuiteOptions): SslContext = {
    applyCipherSuite(SslContextBuilder.forClient(), cipherSuite)
  }
  
  private def createPKCSClientContext(pkcsPath: String,
                                      pkcsPassword: String, 
                                      cipherSuite: VuuSSLCipherSuiteOptions): SslContext = {
    val keyStore = loadKeyStore(pkcsPath, pkcsPassword)
    val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm)
    trustManagerFactory.init(keyStore)
    applyCipherSuite(SslContextBuilder.forClient().trustManager(trustManagerFactory), cipherSuite)
  }
  
  private def applyCipherSuite(sslContextBuilder: SslContextBuilder, 
                               cipherSuite: VuuSSLCipherSuiteOptions): SslContext = {
    if (cipherSuite.ciphers.nonEmpty) {
      sslContextBuilder.ciphers(cipherSuite.ciphers.asJava)
    }
    if (cipherSuite.protocols.nonEmpty) {
      sslContextBuilder.protocols(cipherSuite.protocols.asJava)
    }
    sslContextBuilder.build()
  }

  private def loadKeyStore(keyStorePath: String, keyStorePassword: String): KeyStore = {
    PathChecker.throwOnFileNotExists(keyStorePath, "keystore doesn't appear to exist")
    val keyStore = KeyStore.getInstance("PKCS12")
    Using(new FileInputStream(keyStorePath)) {
      reader => keyStore.load(reader, keyStorePassword.toCharArray)
    }
    keyStore
  }
  
}
