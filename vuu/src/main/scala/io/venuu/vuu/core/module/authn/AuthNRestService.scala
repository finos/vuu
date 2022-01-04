package io.venuu.vuu.core.module.authn

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.net.{Authenticator, LoggedInTokenValidator, ServerUserPrincipal}
import io.venuu.vuu.net.rest.RestService
import io.vertx.core.http.Cookie
import io.vertx.ext.web.RoutingContext

import java.util.concurrent.TimeUnit
import scala.util.{Failure, Success, Try}

class AuthNRestService(val authenticator: Authenticator, val tokenValidator: LoggedInTokenValidator)(implicit clock: Clock) extends RestService with StrictLogging {

  private final val service = "authn"

  override def getServiceName: String = service

  override def getUriGetAll: String = s"/api/$service"

  override def getUriGet: String = s"/api/$service"

  override def getUriPost: String = s"/api/$service"

  override def getUriDelete: String = s"/api/$service"

  override def getUriPut: String = s"/api/$service"

  override def onGetAll(ctx: RoutingContext): Unit = {
    reply404(ctx)
  }

  override def onPost(ctx: RoutingContext): Unit = {
    val (username, password) = Try(ctx.getBodyAsJson()) match {
      case Success(json) =>
        val jsonUser = json.getString("username")
        val jsonPassword = json.getString("password")
        logger.info(s"Got username ${jsonUser} and password ${jsonPassword} from JSON")
        (jsonUser, jsonPassword)

      case Failure(exception) =>
        val fmrBody     = ctx.getBodyAsString()
        val fmrUser     = ctx.getBodyAsString.split("&").find(_.contains("user")).get.replace("user=", "")
        val fmrPassword = ctx.getBodyAsString.split("&").find(_.contains("password")).get.replace("password=", "")
        logger.info(s"Got username ${fmrUser} and password ${fmrPassword} from html form")
        (fmrUser, fmrPassword)
    }

    if (username == null || password == null ) {
      reply404(ctx)
    } else {
      authenticator.authenticator(username, password) match {
        case Some(token) =>
          tokenValidator.register(token, new ServerUserPrincipal(token, username))
          ctx.response()
            .addCookie(Cookie.cookie("vuu-auth-token", token).setMaxAge(TimeUnit.MINUTES.toSeconds(240)))
            .putHeader("vuu-auth-token", token)
            .setStatusCode(201)
            .end()
        case None =>
          ctx.response()
            .setStatusCode(403)
            .end()
      }
    }
  }

  override def onGet(ctx: RoutingContext): Unit = {
    ctx.response().write("<html><body><form action=\"/api/authn\" method=\"POST\">" +
                         "<input type=\"text\" name=\"user\"/><input type=\"password\" name=\"password\"/><input type=\"submit\"/></form></body></html>")
    ctx.response().end()
  }

  override def onPut(ctx: RoutingContext): Unit = {
    reply404(ctx)
  }

  override def onDelete(ctx: RoutingContext): Unit = {
    reply404(ctx)
  }

}
