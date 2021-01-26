/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 13/10/2016.
  *
  */
package io.venuu.vuu.murmur.consensus

import java.util.concurrent.atomic.AtomicInteger

import io.venuu.vuu.murmur.consensus.zk.ZooKeeperPathCache
import org.apache.curator.framework.CuratorFrameworkFactory
import org.apache.curator.retry.RetryNTimes
import org.scalatest.{FeatureSpec, GivenWhenThen, Matchers}
import org.scalatest.concurrent.Eventually
import org.scalatest.time.{Millis, Span}

class ZooKeeperPathCacheTest extends FeatureSpec with GivenWhenThen with Matchers with Eventually{

  import ZooKeeperTestBlock._

  feature("check caches across several nodes"){

    scenario("create cache with children") {

      withZkSvr(2182) { svr =>

        val client = CuratorFrameworkFactory.newClient(svr.getConnectString, new RetryNTimes(10, 300))

        client.start()

        val pathCache = new ZooKeeperPathCache(client)

        pathCache.connect()

        pathCache
          .createPath("/apps/siren/test", "AAABBBCCC".getBytes)
          .createPath("/apps/siren/test2", "AAABBBCCC".getBytes)
          .createPath("/apps/siren/test3", "AAABBBCCC".getBytes)
          .listenTo("/apps/siren/test")
          .listenTo("/apps/siren/test2")
          .listenTo("/apps/siren/test3")

        Thread.sleep(100)

        pathCache.updatePath("/apps/siren/test", "CCCCC".getBytes)

        eventually(timeout(Span(600, Millis)), interval(Span(100, Millis))) {
          val children = pathCache.listChildren("/apps/siren")
          children.size should equal(3)

          children(0).getData should equal("CCCCC".getBytes)
          children(1).getData should equal("AAABBBCCC".getBytes)
          children(2).getData should equal("AAABBBCCC".getBytes)

          client.close()
        }
      }
    }
      scenario("create toop level child and iterate through"){

        withZkSvr(2183) { svr =>

          val client = CuratorFrameworkFactory.newClient(svr.getConnectString, new RetryNTimes(10, 300))

          client.start()

          val pathCache = new ZooKeeperPathCache(client)

          pathCache.connect()

          pathCache
            .createPath("/apps/siren/test", "AAABBBCCC".getBytes)
            .createPath("/apps/siren/test2", "AAABBBCCC".getBytes)
            .createPath("/apps/siren/test3", "AAABBBCCC".getBytes)
            .createPath("/apps/robot/test1", "AAABBBCCC".getBytes)
            .createPath("/apps/robot/test2", "AAABBBCCC".getBytes)
            .listenTo("/apps/siren/test")
            .listenTo("/apps/siren/test2")
            .listenTo("/apps/siren/test3")

          eventually{
            val children = pathCache.listChildren("/apps")
            children.size should equal (2)
          }

        }

      }

    scenario("listen on whole director structure"){

      withZkSvr(2183) { svr =>

        val client = CuratorFrameworkFactory.newClient(svr.getConnectString, new RetryNTimes(10, 300))

        client.start()

        val pathCache = new ZooKeeperPathCache(client)

        pathCache.connect()

        val counter = new AtomicInteger()

        pathCache
          .createPath("/apps/murmur/version", Array[Byte]())
          .listenTo("/apps/murmur/version", new PathListener {
            override def onChildAdded(path: String, data: Array[Byte]): Unit = {
              super.onChildAdded(path, data)
              counter.addAndGet(1)
            }
          })
          .createPath("/apps/murmur/version/version-1.0", "AAABBBCCC".getBytes)
          .createPath("/apps/murmur/version/version-1.1", "AAABBBCCC".getBytes)
          .createPath("/apps/murmur/version/version-1.2", "AAABBBCCC".getBytes)
          .createPath("/apps/vuu/version-1.0", "AAABBBCCC".getBytes)
          .createPath("/apps/vuu/version-1.0", "AAABBBCCC".getBytes)

        eventually{
          counter.get() should equal(4) // we get a callback for the original path also
        }
      }

    }


  }

}
