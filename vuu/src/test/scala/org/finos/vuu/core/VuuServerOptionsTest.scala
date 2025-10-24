package org.finos.vuu.core

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.auth.{AlwaysHappyLoginTokenService, LoginTokenService}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class VuuServerOptionsTest extends AnyFeatureSpec with Matchers {

  Feature("VUU Server option for adding customised login validator should be supported"){

    Scenario("Create 1 security option with LoginTokenService other than the default service, check the type of service"){

    val option = VuuSecurityOptions.apply().withLoginTokenService(LoginTokenService.apply(VuuUser("Mikey")))

    option.loginTokenService shouldBe a [AlwaysHappyLoginTokenService]
    }
  }
}
