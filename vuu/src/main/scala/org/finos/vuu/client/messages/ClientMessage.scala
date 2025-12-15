package org.finos.vuu.client.messages

import java.util.UUID
import java.util.concurrent.atomic.AtomicLong

object RequestId {

  private val requestId: AtomicLong = new AtomicLong(0);

  def oneNew(): String = {
    s"REQ-${requestId.getAndIncrement()}"
  }
}

object SessionId {

  def oneNew(): String = {
    s"SESS-${UUID.randomUUID()}"
  }
}

object ViewPortId {

  def oneNew(): String = {
    s"VP-${UUID.randomUUID()}"
  }
}
