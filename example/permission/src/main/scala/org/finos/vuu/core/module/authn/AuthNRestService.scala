package org.finos.vuu.core.module.authn

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.http.Cookie
import io.vertx.ext.web.RoutingContext
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.{Authenticator, LoggedInTokenValidator, ServerUserPrincipal}

import java.util.concurrent.TimeUnit
import scala.util.{Failure, Success, Try}

object VuuAuthCookie{
  final val Name = "vuu-auth-token"
}

object VuuLoginPage{
  final val Path = "/public/index.html"
}

class LogoutRestService(val authenticator: Authenticator, val tokenValidator: LoggedInTokenValidator)(implicit clock: Clock) extends RestService with StrictLogging {
  private final val service = "logout"

  override def getServiceName: String = service
  override def getUriGetAll: String = s"/api/$service"
  override def getUriGet: String = s"/api/$service"
  override def getUriPost: String = s"/api/$service"
  override def getUriDelete: String = s"/api/$service"
  override def getUriPut: String = s"/api/$service"

  override def onGetAll(ctx: RoutingContext): Unit = reply404(ctx)

  override def onPost(ctx: RoutingContext): Unit = {
    val cookie = ctx.request().getCookie(VuuAuthCookie.Name)

    if(cookie == null){
      logger.warn("Asked to logout, but no cookie for auth token found")
      ctx.redirect("")
    }

    ctx.response().removeCookie(VuuAuthCookie.Name)

  }

  override def onGet(ctx: RoutingContext): Unit = ???

  override def onPut(ctx: RoutingContext): Unit = reply404(ctx)

  override def onDelete(ctx: RoutingContext): Unit = reply404(ctx)
}

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
        logger.info(s"Got credentials for ${jsonUser} from JSON")
        logger.debug(s"Got username ${jsonUser} and password ${jsonPassword} from JSON")
        (jsonUser, jsonPassword)

      case Failure(exception) =>
        val fmrUser     = ctx.getBodyAsString.split("&").find(_.contains("user")).get.replace("user=", "")
        val fmrPassword = ctx.getBodyAsString.split("&").find(_.contains("password")).get.replace("password=", "")
        logger.info(s"Got credentials for ${fmrUser} from html form")
        logger.debug(s"Got username ${fmrUser} and password ${fmrPassword} from html form")
        (fmrUser, fmrPassword)
    }

    if (username == null || password == null ) {
      reply404(ctx)
    } else {
      val credentials = Map("username" -> username, "password" -> password)
      authenticator.authenticate(credentials) match {
        case Some(token) =>
          tokenValidator.register(token, VuuUser(username))
          ctx.response()
            .addCookie(Cookie.cookie(VuuAuthCookie.Name, token).setMaxAge(TimeUnit.MINUTES.toSeconds(240)))
            .putHeader(VuuAuthCookie.Name, token)
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
