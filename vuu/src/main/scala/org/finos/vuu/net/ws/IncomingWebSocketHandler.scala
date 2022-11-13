package org.finos.vuu.net.ws

import io.netty.channel.Channel
import org.finos.vuu.net.json.Serializer
import org.finos.vuu.net.{Authenticator, ClientSessionContainer, ViewServerMessage}

class IncomingWebSocketHandler(sessions: ClientSessionContainer,
                               serializer: Serializer[String, ViewServerMessage],
                               authenticator: Authenticator) {

  def handle(msg: String, channel: Channel) = {

    serializer.deserialize(msg) match {
      case msg: ViewServerMessage =>
        println()
    }

  }

}

