package org.finos.vuu.core.module.authn

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.http.Cookie
import io.vertx.ext.web.RoutingContext
import org.finos.toolbox.time.Clock
import org.finos.vuu.net.auth.{Authenticator, LoginTokenService}
import org.finos.vuu.net.rest.RestService

import java.util.concurrent.TimeUnit
import scala.util.{Failure, Success, Try}

object VuuAuthCookie{
  final val Name = "vuu-auth-token"
}

object VuuLoginPage{
  final val Path = "/public/index.html"
}

class LogoutRestService(val authenticator: Authenticator[_])(implicit clock: Clock) extends RestService with StrictLogging {
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

class AuthNRestService(val loginTokenService: LoginTokenService, val users: Option[java.util.Set[String]])
                      (implicit clock: Clock) extends RestService with StrictLogging {

  private final val service = "authn"
  private final val authenticator: Authenticator[String] = AuthenticatorWithUserList(loginTokenService, users)

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
      authenticator.authenticate(username) match {
        case Right(value) =>
          ctx.response()
            .addCookie(Cookie.cookie(VuuAuthCookie.Name, value).setMaxAge(TimeUnit.MINUTES.toSeconds(240)))
            .putHeader(VuuAuthCookie.Name, value)
            .setStatusCode(201)
            .end()
        case Left(value) =>
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
