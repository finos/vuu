package org.finos.vuu.example.valkey

import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.example.valkey.factory.ValkeyConnectionPool
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.jdk.CollectionConverters.MapHasAsScala

class ValkeyInterfaceTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("Test Valkey Interface"){

    Scenario("Run Valkey Interface Tests"){

      implicit val clock: Clock = new DefaultClock()

      val pool = new ValkeyConnectionPool("127.0.0.1", 6379)

      val jedis = pool.getConnection()

      val hset = jedis.hgetAll("order:1")

      println(hset)

      val keys = jedis.zrange("order.id.pk", 10_000_000, 10_009_999)

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
