package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.auths.VuuUser

import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters.{CollectionHasAsScala, SetHasAsScala}

trait ClientSessionContainer {

  def register(vuuUser: VuuUser, sessionId: ClientSessionId, messageHandler: MessageHandler): Either[String, Unit]

  def getHandler(sessionId: ClientSessionId): Option[MessageHandler]

  def remove(vuuUser: VuuUser, sessionId: ClientSessionId): Unit

  def getSessions: List[ClientSessionId]

  def runOnce(): Unit

}

object ClientSessionContainer {

  def apply(maxSessionsPerUser: Int): ClientSessionContainer = ClientSessionContainerImpl(maxSessionsPerUser)

}

private class ClientSessionContainerImpl(maxSessionsPerUser: Int) extends ClientSessionContainer with StrictLogging {

  if (maxSessionsPerUser < 1) throw new IllegalArgumentException(s"Max sessions per user must be greater than 0 ($maxSessionsPerUser)")

  private val sessionsPerUser = new ConcurrentHashMap[String, Integer]()
  private val sessions = new ConcurrentHashMap[ClientSessionId, MessageHandler]()

  override def getSessions: List[ClientSessionId] = CollectionHasAsScala(sessions.keySet()).asScala.toList

  override def remove(vuuUser: VuuUser, sessionId: ClientSessionId): Unit = {
    logger.trace(s"[SESSION] Removing session ${sessionId.sessionId} for user ${vuuUser.name}")

    sessions.computeIfPresent(sessionId, (_, handler) => {
      handler match {
        case m: MessageHandler =>
          //As session is present, decrement or remove the counter
          sessionsPerUser.compute(vuuUser.name, (_, counter) => {
            if (counter <= 1) {
              logger.trace(s"[SESSION] User ${vuuUser.name} has no more sessions")
              null
            } else {
              logger.trace(s"[SESSION] User ${vuuUser.name} has $counter session(s) remaining")
              counter - 1
            }
          })
          null
      }
    })

    logger.debug(s"[SESSION] Removed session ${sessionId.sessionId} for user ${vuuUser.name}")
  }

  override def register(vuuUser: VuuUser, sessionId: ClientSessionId, messageHandler: MessageHandler): Either[String, Unit] = {
    logger.trace(s"[SESSION] Registering session ${sessionId.sessionId} for user ${vuuUser.name}")

    var userCanRegisterSession = false

    //Determine if we can create a new session and increment the counter if yes
    val sessionCount = sessionsPerUser.compute(vuuUser.name, (_, counter) => {
      counter match {
        case null =>
          userCanRegisterSession = true
          1
        case counter: Int =>
          if (counter < maxSessionsPerUser) {
            userCanRegisterSession = true
            counter + 1
          } else {
            counter
          }
      }
    })

    if (userCanRegisterSession) {
      sessions.put(sessionId, messageHandler)
      logger.trace(s"[SESSION] User ${vuuUser.name} has a total of $sessionCount session(s)")
      logger.debug(s"[SESSION] Registered session ${sessionId.sessionId} for user ${vuuUser.name}")
      Right(())
    } else {
      logger.warn(s"[SESSION] User ${vuuUser.name} has hit the session limit of $maxSessionsPerUser")
      Left("User session limit exceeded")
    }

  }

  override def getHandler(sessionId: ClientSessionId): Option[MessageHandler] = {
    val handler = sessions.get(sessionId)
    Option(handler)
  }

  override def runOnce(): Unit = {
    if (!sessions.isEmpty) {
      SetHasAsScala(sessions.entrySet()).asScala.foreach(entry => entry.getValue.sendUpdates())
    }
  }

}
