package io.venuu.vuu.net.ws

import io.netty.channel.Channel
import io.venuu.vuu.net.json.Serializer
import io.venuu.vuu.net.{Authenticator, ClientSessionContainer, ViewServerMessage}

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

