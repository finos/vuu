package org.finos.vuu.core

import org.finos.vuu.net.LoggedInTokenValidator
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers


class VuuServerOptionsTest extends AnyFeatureSpec with Matchers {

  Feature("VUU Server option for adding customised login validator should be supported"){

    Scenario("Create 1 security option with LoggedInTokenValidator other than the default Validator, check the type of login validator"){

    val option = VuuSecurityOptions.apply()
      .withLoginValidator(new LoggedInTokenValidator)

    option.loginTokenValidator shouldBe a [LoggedInTokenValidator]
    }
  }
}
