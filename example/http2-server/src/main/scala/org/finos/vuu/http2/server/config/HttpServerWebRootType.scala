package org.finos.vuu.http2.server.config

sealed trait HttpServerWebRootType

object WebRootDisabled extends HttpServerWebRootType

object ClassPathWebRoot extends HttpServerWebRootType

case class AbsolutePathWebRoot(path: String, directoryListings: Boolean = false) extends HttpServerWebRootType

