package org.finos.vuu.http2.server.vertx

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.http.{HttpMethod, HttpServerOptions}
import io.vertx.core.net.{KeyCertOptions, PemKeyCertOptions, PfxOptions}
import io.vertx.core.{AbstractVerticle, Promise}
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.{BodyHandler, StaticHandler}
import org.finos.vuu.http2.server.config.{AbsolutePathWebRoot, ClassPathWebRoot, VuuHttp2ServerOptions, WebRootDisabled}
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.ssl.{VuuSSLCipherSuiteOptions, VuuSSLDisabled, VuuSSLOptions, VuuSSLByCertAndKey, VuuSSLByPKCS}
import org.finos.vuu.util.PathChecker

import java.io.File
import java.util
import java.util.concurrent.atomic.{AtomicBoolean, AtomicInteger}

class VertxHttp2Server(val options: VuuHttp2ServerOptions, val services: List[RestService]) extends AbstractVerticle with StrictLogging {

  private val running = new AtomicBoolean(false)
  private val port = new AtomicInteger(-1)

  override def start(startPromise: Promise[Void]): Unit = {
    try {
      val router = Router.router(vertx);

      val httpOpts = httpServerOptions(options.sslOptions)

      import io.vertx.ext.web.handler.CorsHandler
      val allowedHeaders = new util.HashSet[String]()
      allowedHeaders.add("x-requested-with")
      allowedHeaders.add("Access-Control-Allow-Origin")
      allowedHeaders.add("origin")
      allowedHeaders.add("Content-Type")
      allowedHeaders.add("accept")
      allowedHeaders.add("X-PINGARUNER")

      val allowedMethods = new util.HashSet[HttpMethod]()
      allowedMethods.add(HttpMethod.GET)
      allowedMethods.add(HttpMethod.POST)
      allowedMethods.add(HttpMethod.OPTIONS)
      /*
       * these methods aren't necessary for this sample,
       * but you may need them for your projects
       */
      allowedMethods.add(HttpMethod.DELETE)
      allowedMethods.add(HttpMethod.PATCH)
      allowedMethods.add(HttpMethod.PUT)

      router.route.handler(
        CorsHandler.create()
          .addOriginWithRegex(".*")
          .allowedHeaders(allowedHeaders)
          .allowedMethods(allowedMethods)
      )

      services.foreach(service => addRestService(router, service))

      var webRoot: String = null
      options.webRoot match {
        case WebRootDisabled =>
          webRoot = "disabled"
        case ClassPathWebRoot => {
          webRoot = "classpath://webroot"
          router.route("/public/*")
            .handler(StaticHandler.create())
          router.route("/*")
            .handler(StaticHandler.create())
        }
        case AbsolutePathWebRoot(path: String, directoryListings: Boolean) => {
          webRoot = new File(path).getAbsoluteFile.toString
          PathChecker.throwOnDirectoryNotExists(path, "webroot path does not exist:")

          router.route("/public/*").handler(
            StaticHandler.create(path)
              .setDirectoryListing(directoryListings)
          )

          // Serve the static pages
          router.route("/*").handler(
            StaticHandler.create(path)
              .setDirectoryListing(directoryListings)
          )
        }
      }

      val server = vertx.createHttpServer(httpOpts).requestHandler(router).listen(options.port)
        .onSuccess { server =>
          port.set(server.actualPort())
          logger.info(s"[HTTP2] Server Started @ ${server.actualPort()} on / with webroot $webRoot ")
          running.set(true)
          startPromise.complete()
        }
        .onFailure { err =>
          logger.error("[HTTP2] Failed to start server", err)
          startPromise.fail(err)
        }
    } catch {
      case e: Exception =>
        logger.error("[HTTP2] Error occurred starting server", e)
    }
  }

  override def stop(stopPromise: Promise[Void]): Unit = {
    running.set(false)
    super.stop()
  }

  def isRunning: Boolean = running.get()

  def getPort: Int = port.get()

  private def addRestService(router: Router, service: RestService): Unit = {

    logger.debug(s"Adding REST service /api/${service.getServiceName}")
    logger.debug(s"    POST URI:" + service.getUriPost)
    logger.debug(s"    PUT URI:" + service.getUriPut)
    logger.debug(s"    GET URI:" + service.getUriGet)
    logger.debug(s"    GET ALL URI:" + service.getUriGetAll)
    logger.debug(s"    DELETE URI:" + service.getUriDelete)

    logger.debug(s"Routing requests from:" + s"/api/${service.getServiceName}*")

    router.route(s"/api/${service.getServiceName}*").handler(BodyHandler.create())

    router.get(service.getUriGet).handler(req => service.onGet(VertxRestContext(req)))
    router.get(service.getUriGetAll).handler(req => service.onGetAll(VertxRestContext(req)))
    router.delete(service.getUriDelete).handler(req => service.onDelete(VertxRestContext(req)))
    router.post(service.getUriPost).handler(req => service.onPost(VertxRestContext(req)))
    router.put(service.getUriPut).handler(req => service.onPut(VertxRestContext(req)))
  }
  
  private def httpServerOptions(options: VuuSSLOptions): HttpServerOptions = {
    options match {
      case VuuSSLDisabled => HttpServerOptions().setSsl(false)
      case VuuSSLByCertAndKey(certPath, keyPath, _, cipherSuite) =>
        applySharedOptions(pemKeyCertOptions(certPath, keyPath), cipherSuite)
      case VuuSSLByPKCS(pkcsPath, pkcsPassword, cipherSuite) =>
        applySharedOptions(pfxKeyCertOptions(pkcsPath, pkcsPassword), cipherSuite)
    }
  }

  private def applySharedOptions(keyCertOptions: KeyCertOptions, cipherSuite: VuuSSLCipherSuiteOptions) : HttpServerOptions = {
    val httpServerOptions = HttpServerOptions()
    httpServerOptions.setKeyCertOptions(keyCertOptions)
    httpServerOptions.setSsl(true)
    httpServerOptions.setUseAlpn(true)
    for (cipher <- cipherSuite.ciphers) {
      httpServerOptions.addEnabledCipherSuite(cipher)
    }
    for (protocol <- cipherSuite.protocols) {
      httpServerOptions.addEnabledSecureTransportProtocol(protocol)
    }
    httpServerOptions
  }

  private def pfxKeyCertOptions(pkcsPath: String, pkcsPassword: String): PfxOptions =  {
    PathChecker.throwOnFileNotExists(pkcsPath, "pkcsPath doesn't appear to exist")
    logger.debug("Loading PKCS from: {}", new File(pkcsPath).getAbsolutePath)
    new PfxOptions()
      .setPath(pkcsPath)
      .setPassword(pkcsPassword)
  }

  private def pemKeyCertOptions(certPath: String, keyPath: String): PemKeyCertOptions = {
    PathChecker.throwOnFileNotExists(certPath, "certPath doesn't appear to exist")
    PathChecker.throwOnFileNotExists(keyPath, "keyPath doesn't appear to exist")

    logger.debug("Loading SSL Cert from: " + new File(certPath).getAbsolutePath)
    logger.debug("Loading SSL Key from: " + new File(keyPath).getAbsolutePath)

    new PemKeyCertOptions()
      .setCertPath(certPath)
      .setKeyPath(keyPath)
  }
}


