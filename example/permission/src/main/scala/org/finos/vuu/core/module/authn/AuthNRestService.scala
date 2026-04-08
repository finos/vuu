package org.finos.vuu.core.module.authn

import com.typesafe.scalalogging.StrictLogging
import io.vertx.core.http.Cookie
import io.vertx.ext.web.RoutingContext
import org.finos.toolbox.time.Clock
import org.finos.vuu.net.auth.{Authenticator, LoginTokenService}
import org.finos.vuu.net.rest.{JsonEntityEncoder, RestContext, RestService, StringEncoder}

import java.util.concurrent.TimeUnit
import scala.util.{Failure, Success, Try}

object VuuAuthHeader{
  final val Name = "vuu-auth-token"
}

object VuuLoginPage {
  final val Path = "/public/index.html"
}

class AuthNRestService(val loginTokenService: LoginTokenService, val users: Option[Map[String, String]])
                      (using clock: Clock) extends RestService with StrictLogging {

  private final val service = "authn"
  private final val uri = s"/api/$service"
  private final val authenticator: Authenticator[LoginRequest] = AuthenticatorWithUserList(loginTokenService, users)
  private val loginRequestEncoder = JsonEntityEncoder[LoginRequest]()
  private val loginResponseEncoder = JsonEntityEncoder[LoginResponse]()
  
  override def getServiceName: String = service

  override def getUriGetAll: String = uri

  override def getUriGet: String = uri

  override def getUriPost: String = uri

  override def getUriDelete: String = uri

  override def getUriPut: String = uri

  override def onPost(ctx: RestContext): Unit = {
    val loginRequest = ctx.bodyAs(loginRequestEncoder)
    loginRequest match {
      case Success(value) =>
        authenticator.authenticate(value) match {
          case Right(token) =>
            val response = LoginResponse(value.username, token)
            ctx.respond(200, response, loginResponseEncoder, Map(VuuAuthHeader.Name -> token))
          case Left(value) =>
            ctx.respond(401, value, StringEncoder)
        }
      case Failure(exception) =>
        logger.error("Failed to convert body into login request", exception)
        ctx.respond(401)
    }
  }
}

case class LoginRequest(username: String, password: String) { }

case class LoginResponse(username: String, token: String) { }

