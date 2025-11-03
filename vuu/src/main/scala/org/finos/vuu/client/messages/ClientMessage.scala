package org.finos.vuu.client.messages

import java.util.UUID
import java.util.concurrent.atomic.AtomicLong

object RequestId {

  private val requestId: AtomicLong = new AtomicLong(0);

  def oneNew(): String = {
    "REQ-" + requestId.getAndIncrement()
  }
}

object SessionId {
  def oneNew(): String = {
    "SESS-" + UUID.randomUUID().toString
  }
}

object ViewPortId {
  private val viewportId: AtomicLong = new AtomicLong(0);

  def oneNew(): String = {
    "VP-" + "%08d".format(viewportId.getAndIncrement())
  }
}
