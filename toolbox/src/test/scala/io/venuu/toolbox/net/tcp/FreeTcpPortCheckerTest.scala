/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 05/09/2016.
  *
  */
package io.venuu.toolbox.net.tcp

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FreeTcpPortCheckerTest extends AnyFeatureSpec with Matchers {

  Feature("check the port allocator"){

    Scenario("check some free ports, then block one and check it fails"){

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
