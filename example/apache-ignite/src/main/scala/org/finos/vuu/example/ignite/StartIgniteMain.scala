package org.finos.vuu.example.ignite

import org.apache.ignite.Ignition

object StartIgniteMain extends App {
  val configuration = IgniteLocalConfig.create(clientMode = false).igniteConfiguration()
  val ignite = Ignition.getOrStart(configuration)
}
