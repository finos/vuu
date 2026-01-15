package org.finos.vuu.net

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.auths.VuuUser

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
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

  private val sessionsPerUser = new ConcurrentHashMap[String, AtomicInteger]()
  private val sessions = new ConcurrentHashMap[ClientSessionId, MessageHandler]()

  override def getSessions: List[ClientSessionId] = CollectionHasAsScala(sessions.keySet()).asScala.toList

  override def remove(vuuUser: VuuUser, sessionId: ClientSessionId): Unit = {
    logger.trace(s"[SESSION] Removing session ${sessionId.sessionId} for user ${vuuUser.name}")
    if (sessions.remove(sessionId) != null) {
      sessionsPerUser.compute(vuuUser.name, (_, value) => {
        if (value.get() <= 1) {
          logger.trace(s"[SESSION] User ${vuuUser.name} has no more sessions")
          null
        } else {
          value.decrementAndGet()
          logger.trace(s"[SESSION] User ${vuuUser.name} has $value session(s) remaining")
          value
        }
      })
    }
    logger.debug(s"[SESSION] Removed session ${sessionId.sessionId} for user ${vuuUser.name}")
  }

  override def register(vuuUser: VuuUser, sessionId: ClientSessionId, messageHandler: MessageHandler): Either[String, Unit] = {
    logger.trace(s"[SESSION] Registering session ${sessionId.sessionId} for user ${vuuUser.name}")

    var sessionCreated = false

    val counter = sessionsPerUser.computeIfAbsent(vuuUser.name, _ => AtomicInteger(0))

    val updated = counter.updateAndGet { current =>
      if (current < maxSessionsPerUser) {
        sessions.put(sessionId, messageHandler)
        sessionCreated = true
        current + 1
      } else {
        current
      }
    }

    logger.trace(s"[SESSION] User ${vuuUser.name} has a total of $updated session(s)")

    if (sessionCreated) {
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
    if(!sessions.isEmpty) {
      SetHasAsScala(sessions.entrySet()).asScala.foreach(entry => entry.getValue.sendUpdates())
    }
  }

}
