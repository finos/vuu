package org.finos.vuu.net.http

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.http.{HttpMethod, HttpServerOptions}
import io.vertx.core.net.{PemKeyCertOptions, PfxOptions}
import io.vertx.core.{AbstractVerticle, Vertx, VertxOptions}
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.{BodyHandler, StaticHandler}
import org.finos.toolbox.lifecycle.LifecycleEnabled
import org.finos.vuu.core.{VuuSSLByCertAndKey, VuuSSLByPKCS, VuuSSLCipherSuiteOptions, VuuSSLDisabled, VuuSSLOptions}
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.util.PathChecker

import java.io.File
import java.util

object Http2Server {

  def apply(options: VuuHttp2ServerOptions): Http2Server = {
    apply(options, List.empty)
  }

  def apply(options: VuuHttp2ServerOptions, services: List[RestService]): Http2Server = {
    if (options.isEnabled) {
      VuuHttp2Server(options, services)
    } else {
      DisabledHttp2Server()
    }
  }
}

trait Http2Server extends LifecycleEnabled {
  def join(): Unit
}

class VertxHttp2Verticle(val options: VuuHttp2ServerOptions, val services: List[RestService]) extends AbstractVerticle with StrictLogging {

  def addRestService(router: Router, service: RestService): Unit = {

    logger.debug(s"Adding REST service /api/${service.getServiceName}")
    logger.debug(s"    POST URI:" + service.getUriPost)
    logger.debug(s"    PUT URI:" + service.getUriPut)
    logger.debug(s"    GET URI:" + service.getUriGet)
    logger.debug(s"    GET ALL URI:" + service.getUriGetAll)
    logger.debug(s"    DELETE URI:" + service.getUriDelete)

    logger.debug(s"Routing requests from:" + s"/api/${service.getServiceName}*")

    router.route(s"/api/${service.getServiceName}*").handler(BodyHandler.create())

    router.get(service.getUriGet).handler(req => service.onGet(req))
    router.get(service.getUriGetAll).handler(req => service.onGetAll(req))
    router.delete(service.getUriDelete).handler(req => service.onDelete(req))
    router.post(service.getUriPost).handler(req => service.onPost(req))
    router.put(service.getUriPut).handler(req => service.onPut(req))
  }

  override def start(): Unit = {
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
        case WebRootDisabled() =>
          webRoot = "disabled"
        case ClassPathWebRoot() => {
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

      vertx.createHttpServer(httpOpts).requestHandler(router).listen(options.port)
      logger.info(s"[HTTP2] Server Started @ ${options.port} on / with webroot $webRoot ")

    } catch {
      case e: Exception =>
        logger.error("[HTTP2] Error occurred starting server", e)
    }
  }

  private def httpServerOptions(options: VuuSSLOptions): HttpServerOptions = {
    options match {
      case VuuSSLDisabled() => new HttpServerOptions().setSsl(false)
      case VuuSSLByCertAndKey(certPath, keyPath, _, cipherSuite) =>
        applySharedOptions(new HttpServerOptions().setKeyCertOptions(pemKeyCertOptions(certPath, keyPath)), cipherSuite)
      case VuuSSLByPKCS(pkcsPath, pkcsPassword, cipherSuite) =>
        applySharedOptions(new HttpServerOptions().setKeyCertOptions(pfxKeyCertOptions(pkcsPath, pkcsPassword)), cipherSuite)
    }
  }

  private def applySharedOptions(httpServerOptions: HttpServerOptions, cipherSuite: VuuSSLCipherSuiteOptions) : HttpServerOptions = {
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

case class DisabledHttp2Server() extends Http2Server {

  override def join(): Unit = {
    //Nothing to do
  }

  override def doStart(): Unit = {
    //Nothing to do
  }

  override def doStop(): Unit = {
    //Nothing to do
  }

  override def doInitialize(): Unit = {
    //Nothing to do
  }

  override def doDestroy(): Unit = {
    //Nothing to do
  }

  override val lifecycleId: String = "DisabledHttp2Server"

}

case class VuuHttp2Server(options: VuuHttp2ServerOptions, services: List[RestService]) extends Http2Server {

  private final val verticle = new VertxHttp2Verticle(options, services)
  private final val vertx = Vertx.vertx(new VertxOptions())

  @volatile
  private var running = false

  override def doStart(): Unit = {
    vertx.deployVerticle(verticle)
    running = true
  }

  override def doStop(): Unit = {
    vertx.close()
    running = false
  }

  override def join(): Unit = {
  }

  override def doInitialize(): Unit = {

  }

  override def doDestroy(): Unit = {
  }

  override val lifecycleId: String = "VertxHttp2Server"

  def isRunning: Boolean = running

}
