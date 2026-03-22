package org.finos.vuu.core.module.authn

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.http.Cookie
import io.vertx.ext.web.RoutingContext
import org.finos.toolbox.time.Clock
import org.finos.vuu.net.auth.{Authenticator, LoginTokenService}
import org.finos.vuu.net.rest.{RestContext, RestService}

import java.util.concurrent.TimeUnit
import scala.util.{Failure, Success, Try}

object VuuAuthCookie{
  final val Name = "vuu-auth-token"
}

object VuuLoginPage {
  final val Path = "/public/index.html"
}

class AuthNRestService(val loginTokenService: LoginTokenService, val users: Option[Map[String, String]])
                      (using clock: Clock) extends RestService with StrictLogging {

  private final val service = "authn"
  private final val authenticator: Authenticator[(String,String)] = AuthenticatorWithUserList(loginTokenService, users)

  override def getServiceName: String = service

  override def getUriGetAll: String = s"/api/$service"

  override def getUriGet: String = s"/api/$service"

  override def getUriPost: String = s"/api/$service"

  override def getUriDelete: String = s"/api/$service"

  override def getUriPut: String = s"/api/$service"

  override def onGetAll(ctx: RestContext): Unit = {
    reply404(ctx)
  }

  override def onPost(ctx: RestContext): Unit = {
    val body = ctx.body
    
    val (username, password) = Try(body.asJsonObject()) match {
      case Success(json) =>
        val jsonUser = json.getString("username")
        val jsonPassword = json.getString("password")
        logger.info(s"Got credentials for ${jsonUser} from JSON")
        logger.debug(s"Got username ${jsonUser} and password ${jsonPassword} from JSON")
        (jsonUser, jsonPassword)
    }

    if (username != null && password != null ) {
      authenticator.authenticate((username, password)) match {
        case Right(value) => ctx.respond(201, headers = Map(VuuAuthCookie.Name -> value))
        case Left(value) => ctx.respond(401)
      }
    } else {
      ctx.respond(401)
    } 
  }

  override def onGet(ctx: RestContext): Unit = {
    reply404(ctx)
  }

  override def onPut(ctx: RestContext): Unit = {
    reply404(ctx)
  }

  override def onDelete(ctx: RestContext): Unit = {
    reply404(ctx)
  }

}
