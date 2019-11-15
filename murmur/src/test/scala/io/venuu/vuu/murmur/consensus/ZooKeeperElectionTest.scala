/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 26/02/2016.

  */
package io.venuu.vuu.murmur.consensus

import io.venuu.vuu.murmur.consensus.zk.ZooKeeperElection
import org.apache.curator.framework.CuratorFrameworkFactory
import org.apache.curator.retry.RetryNTimes
import org.apache.curator.test.TestingServer
import org.scalatest._

class ZooKeeperElectionTest extends FeatureSpec {

  import ZooKeeperTestBlock._

  def client(svr: TestingServer) = {
    val client = CuratorFrameworkFactory.newClient(svr.getConnectString, new RetryNTimes(10, 300))
    client.start()
    client
  }

  feature("check we can wrap zookeeper"){

    scenario("check we can select leaders and interrogate state"){

         withZkSvr(2181){ svr =>

           val clusterName = "test"

           //val client = CuratorFrameworkFactory.newClient(svr.getConnectString, new RetryNTimes(10, 300))

           //client.start()

           val vs1 = new ZooKeeperElection("vs-1", client(svr), clusterName).connect()

           val ems1 = new ZooKeeperElection("ems-1", client(svr), clusterName).connect()

           Thread.sleep(5000)

           val ems2 = new ZooKeeperElection("ems-2", client(svr), clusterName).connect()

           val ems3 = new ZooKeeperElection("ems-3", client(svr), clusterName).connect()

           val ems4 = new ZooKeeperElection("ems-4", client(svr), clusterName).connect()

           Thread.sleep(10000)

           println("sleeping")

           ems1.disconnect()

           Thread.sleep(10000)

           //client.close()
         }
    }

  }


}
