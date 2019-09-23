/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 26/02/2016.

  */
package io.venuu.toolbox.consensus

import org.apache.curator.test.TestingServer

object ZooKeeperTestBlock {

  def withZkSvr(port: Int)(block: (TestingServer) => Unit): Unit = {

    val zookeeperSvr = new TestingServer(2181)

    zookeeperSvr.start()

    block(zookeeperSvr)

    zookeeperSvr.stop()

  }

}
