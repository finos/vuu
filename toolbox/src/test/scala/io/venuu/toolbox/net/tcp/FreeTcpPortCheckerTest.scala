/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 05/09/2016.
  *
  */
package io.venuu.toolbox.net.tcp

import org.scalatest._

class FreeTcpPortCheckerTest extends FeatureSpec with Matchers {

  feature("check the port allocator"){

    scenario("check some free ports, then block one and check it fails"){

      import FreeTcpPortChecker._

      available(10550) should equal( true )
      available(10551) should equal( true )
      available(10552) should equal( true )

      blockWhile(10553){
        available(10553) should equal(false)
      }

      blockWhile(1024){
        nextFree() should equal(1025)
      }

    }
  }
}
