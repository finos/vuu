package org.finos.vuu.net.ws

import java.time.Duration

object WebSocketConstants {
  final val MAX_CONTENT_LENGTH = 262_144 //256 KB
  final val CLIENT_IDLE_TIMEOUT = Duration.ofSeconds(30)
}

