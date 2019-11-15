/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 26/02/2016.

  */
package io.venuu.vuu.murmur.consensus

import org.apache.curator.test.TestingServer

object ZooKeeperTestBlock {

  def withZkSvr(port: Int)(block: (TestingServer) => Unit): Unit = {

    val zookeeperSvr = new TestingServer(2181)

    try{
      zookeeperSvr.start()

      block(zookeeperSvr)
    }finally{
      zookeeperSvr.stop()
      zookeeperSvr.close()
    }

  }

}
