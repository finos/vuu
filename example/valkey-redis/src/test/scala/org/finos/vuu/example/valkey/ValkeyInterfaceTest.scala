package org.finos.vuu.example.valkey

import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.jdk.CollectionConverters.MapHasAsScala

class ValkeyInterfaceTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("Test Valkey Interface"){

    ignore("Run Valkey Interface Tests"){

      implicit val clock: Clock = new DefaultClock()

      val config = new io.valkey.JedisPoolConfig()
      // It is recommended that you set maxTotal = maxIdle = 2*minIdle for best performance
      config.setMaxTotal(32)
      config.setMaxIdle(32)
      config.setMinIdle(16)

      val jedisPool = new io.valkey.JedisPool(config, "127.0.0.1", 6379, false)

      val jedis = jedisPool.getResource()

      val hset = jedis.hgetAll("order:1")

      println(hset)

      val keys = jedis.zrange("order.id.pk", 10_000_000, 10_010_000)

      //ZCOUNT order.currency.idx -inf +inf
      val keyCount = jedis.zcount("order.currency.idx", "-inf", "+inf")

      //println(keys)

      val (time, result) = timeIt{
        keys.toArray.map( k => jedis.hgetAll("order:" + k.toString).asScala).toList
      }

      println(s"Loaded ${keys.size()} in: " + time + " ms from count: " + keyCount)
    }

  }

}
