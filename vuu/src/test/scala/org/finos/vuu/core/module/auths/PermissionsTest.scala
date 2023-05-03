package org.finos.vuu.core.module.auths

import com.typesafe.scalalogging.StrictLogging
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class PermissionsTest extends AnyFeatureSpec with Matchers with StrictLogging with GivenWhenThen {

  Feature("Check our example Permission Set"){

    Scenario("Validate our boolean logic"){

      PermissionSet.NoPermissions should equal(0)
      PermissionSet.SalesTradingPermission should equal(1)
      PermissionSet.AlgoCoveragePermission should equal(2)
      PermissionSet.HighTouchPermission should equal(4)
    }
  }

}
