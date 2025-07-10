package org.finos.vuu.net.http

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.util.PathChecker
import io.vertx.core.http.{HttpMethod, HttpServerOptions}
import io.vertx.core.net.PemKeyCertOptions
import io.vertx.core.{AbstractVerticle, Vertx, VertxOptions}
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.{BodyHandler, StaticHandler}
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}

import java.io.File
import java.util

object VuuHttp2Server {
  def apply(options: VuuHttp2ServerOptions, services: List[RestService])(implicit lifecycle: LifecycleContainer): Http2Server = {
    new VuuHttp2Server(options, services)
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

      val httpOpts = new HttpServerOptions()

      if (options.sslEnabled) {
        httpOpts
          .setPemKeyCertOptions(pemKeyCertOptions(options))
          .setSsl(true)
          .setUseAlpn(true)
      } else {
        httpOpts.setSsl(false)
      }

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

      router.route.handler(CorsHandler.create("*").allowedHeaders(allowedHeaders).allowedMethods(allowedMethods))

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

          router.route("/public/*")
            .handler(StaticHandler.create()
              .setWebRoot(path)
              .setDirectoryListing(directoryListings)
            )

          // Serve the static pages
          router.route("/*")
            .handler(StaticHandler.create()
              .setWebRoot(path)
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

  private def pemKeyCertOptions(options: VuuHttp2ServerOptions): PemKeyCertOptions = {
    PathChecker.throwOnFileNotExists(options.certPath, "options.certPath, doesn't appear to exist")
    PathChecker.throwOnFileNotExists(options.keyPath, "options.keyPath, doesn't appear to exist")

    logger.debug("Loading SSL Cert from: " + new File(options.certPath).getAbsolutePath)
    logger.debug("Loading SSL Key from: " + new File(options.keyPath).getAbsolutePath)

    new PemKeyCertOptions()
      .setCertPath(options.certPath)
      .setKeyPath(options.keyPath)
  }
}


class VuuHttp2Server(val options: VuuHttp2ServerOptions, val services: List[RestService])(implicit lifecycle: LifecycleContainer) extends Http2Server {

  private final val verticle = new VertxHttp2Verticle(options, services)

  val vxoptions = new VertxOptions();

  private val vertx = Vertx.vertx(vxoptions);

  override def doStart(): Unit = {
    vertx.deployVerticle(verticle);
  }

  override def doStop(): Unit = {
    vertx.close()
  }

  override def join(): Unit = {
  }

  override def doInitialize(): Unit = {

  }

  override def doDestroy(): Unit = {
  }

  override val lifecycleId: String = "VertxHttp2Server"
}
