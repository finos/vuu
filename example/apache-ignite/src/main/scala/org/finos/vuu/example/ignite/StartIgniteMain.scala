package org.finos.vuu.example.ignite

import org.apache.ignite.Ignition

object StartIgniteMain extends App {
  IgniteLocalConfig.setPersistenceEnabled(false)
  val configuration = IgniteLocalConfig.create(false)
  val ignite = Ignition.getOrStart(configuration)
}
