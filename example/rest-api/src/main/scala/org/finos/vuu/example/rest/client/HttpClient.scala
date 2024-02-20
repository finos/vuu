package org.finos.vuu.example.rest.client

import sttp.client4.{Request, Response, SyncBackend}

trait HttpClient {
  def fetch[T](req: Request[T]): Response[T]
}

object HttpClient {
  def apply(backend: SyncBackend): HttpClient = new SttpClient(backend)
}

private class SttpClient(backend: SyncBackend) extends HttpClient {
  override def fetch[T](req: Request[T]): Response[T] = req.send(backend)
}
