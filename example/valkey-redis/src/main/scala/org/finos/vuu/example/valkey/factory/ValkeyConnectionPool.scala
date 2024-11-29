package org.finos.vuu.example.valkey.factory

import io.valkey.{Jedis, JedisPool}

class ValkeyConnectionPool(val ipaddress: String, val port: Int) {

  val config = new io.valkey.JedisPoolConfig()
  // It is recommended that you set maxTotal = maxIdle = 2*minIdle for best performance
  config.setMaxTotal(32)
  config.setMaxIdle(32)
  config.setMinIdle(16)

  final val jedisPool: JedisPool = new io.valkey.JedisPool(config, ipaddress, port, false)

  def getConnection(): Jedis = {
    jedisPool.getResource()
  }
}
