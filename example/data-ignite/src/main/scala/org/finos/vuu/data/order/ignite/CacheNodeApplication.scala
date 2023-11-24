package org.finos.vuu.data.order.ignite

import org.apache.ignite.Ignition

object CacheNodeApplication extends App {
  IgniteLocalConfig.setPersistenceEnabled(false)
  val configuration = IgniteLocalConfig.create(false)

  val ignite = Ignition.getOrStart(configuration)
}
