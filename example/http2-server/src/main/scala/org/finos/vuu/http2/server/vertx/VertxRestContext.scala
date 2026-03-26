package org.finos.vuu.http2.server.vertx

import com.typesafe.scalalogging.StrictLogging
import io.vertx.ext.web.RoutingContext
import org.finos.vuu.net.rest.{AttributeKey, AttributeMap, Cookie, EntityEncoder, RestContext}

import java.io.ByteArrayInputStream
import scala.jdk.CollectionConverters.*

class VertxRestContext(val underlying: RoutingContext) extends RestContext with StrictLogging {

  override def method: String = underlying.request().method().name()
  override def uri: String = underlying.request().uri()
  override def remoteAddress: String = underlying.request().remoteAddress().host()

  override lazy val requestHeaders: Map[String, String] =
    underlying.request().headers().asScala.map(e => e.getKey -> e.getValue).toMap

  override lazy val pathParams: Map[String, String] =
    underlying.pathParams().asScala.toMap

  override lazy val queryParams: Map[String, Seq[String]] =
    underlying.queryParams().entries().asScala.groupBy(_.getKey).map {
      case (k, v) => k -> v.map(_.getValue).toSeq
    }

  override lazy val formParams: Map[String, Seq[String]] =
    underlying.request().formAttributes().asScala.groupBy(_.getKey).map {
      case (k, v) => k -> v.map(_.getValue).toSeq
    }

  override lazy val cookies: Map[String, String] =
    underlying.request().cookies().asScala.map(c => c.getName -> c.getValue).toMap

  private lazy val bodyBytes: Array[Byte] = {
    val buffer = underlying.body().buffer()
    if (buffer != null) buffer.getBytes else Array.emptyByteArray
  }

  override def bodyInputStream: java.io.InputStream = new ByteArrayInputStream(bodyBytes)

  override def bodyAs[T](entityEncoder: EntityEncoder[T]): Option[T] = {
    try {
      Some(entityEncoder.decode(bodyInputStream))
    } catch {
      case e: Exception => 
        logger.error("Failed to get body from input stream", e)
        None
    }
  }

  override val attributes: VertxAttributeMap = new VertxAttributeMap(underlying)

  override def respond[T](
                           status: Int,
                           body: T = null,
                           entityEncoder: EntityEncoder[T],
                           headers: Map[String, String] = Map.empty,
                           cookies: Seq[Cookie] = Seq.empty
                         ): Unit = {
    val response = underlying.response().setStatusCode(status)

    headers.foreach { case (k, v) => response.putHeader(k, v) }
    response.putHeader("Content-Type", entityEncoder.contentType)

    cookies.foreach { c =>
      val vCookie = io.vertx.core.http.Cookie.cookie(c.name, c.value)
      vCookie.setPath(c.path)
      c.maxAge.foreach(m => vCookie.setMaxAge(m.toLong))
      vCookie.setSecure(c.secure)
      vCookie.setHttpOnly(c.httpOnly)
      underlying.response().addCookie(vCookie)
    }

    if (body != null) {
      val bytes = entityEncoder.encode(body)
      response.end(io.vertx.core.buffer.Buffer.buffer(bytes))
    } else {
      response.end()
    }
  }

  override def redirect(location: String, status: Int = 302): Unit = {
    underlying.response()
      .setStatusCode(status)
      .putHeader("Location", location)
      .end()
  }
}

class VertxAttributeMap(ctx: io.vertx.ext.web.RoutingContext) extends AttributeMap {
  def put[T](key: AttributeKey[T], value: T): Unit = {
    ctx.put(key.name, value)
  }

  def get[T](key: AttributeKey[T]): Option[T] = {
    Option(ctx.get[T](key.name))
  }
}
