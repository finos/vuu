package io.venuu.vuu.net.http

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import io.vertx.core.{AbstractVerticle, Vertx, VertxOptions}
import io.vertx.core.http.HttpServerOptions
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.StaticHandler

object VuuHttp2Server{
  def apply(options: VuuHttp2ServerOptions)(implicit lifecycle: LifecycleContainer): Http2Server = {
    new VuuHttp2Server(options)
  }
}

trait Http2Server extends LifecycleEnabled {
  def join(): Unit
}

class VertxHttp2Verticle(val options: VuuHttp2ServerOptions) extends AbstractVerticle with StrictLogging {

  override def start(): Unit = {
    try{

      val router = Router.router(vertx);

      import io.vertx.core.net.PemKeyCertOptions

      val httpOpts = new HttpServerOptions()

      httpOpts
        .setPemKeyCertOptions(new PemKeyCertOptions()
          .setCertPath(options.certPath)
          .setKeyPath(options.keyPath)
        )
        .setSsl(true)
        .setUseAlpn(true)

      // Serve the static pages
      router.route("/*").handler(StaticHandler.create()
        .setWebRoot(options.webRoot)
        .setDirectoryListing(true)
      )

      vertx.createHttpServer(httpOpts).requestHandler(router).listen(options.port);

      logger.info(s"[HTTP2] Server Started @ ${options.port} on / with webroot ${options.webRoot} ")

    }catch{
      case e: Exception =>
        logger.error("[HTTP2] Error occurred starting server", e)
    }
  }
}



class VuuHttp2Server(val options: VuuHttp2ServerOptions)(implicit lifecycle: LifecycleContainer) extends Http2Server {

  private final val verticle = new VertxHttp2Verticle(options)
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
