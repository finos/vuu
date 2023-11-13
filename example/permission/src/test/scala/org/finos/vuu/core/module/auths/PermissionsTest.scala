package org.finos.vuu.core.module.auths

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.module.auths.PermissionSet._
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class PermissionsTest extends AnyFeatureSpec with Matchers with StrictLogging with GivenWhenThen {

  Feature("Check our example Permission Set"){

    Scenario("Validate our boolean logic"){

      NoPermissions should equal(0)
      SalesTradingPermission should equal(1)
      AlgoCoveragePermission should equal(2)
      HighTouchPermission should equal(4)

      val salesOnly = addRole(PermissionSet.NoPermissions, PermissionSet.SalesTradingPermission)

      hasRole(salesOnly, PermissionSet.SalesTradingPermission) should equal(true)
      hasRole(salesOnly, PermissionSet.HighTouchPermission) should equal(false)
      hasRole(salesOnly, PermissionSet.AlgoCoveragePermission) should equal(false)

      val algoOnly = addRole(PermissionSet.NoPermissions, PermissionSet.AlgoCoveragePermission)

      hasRole(algoOnly, PermissionSet.SalesTradingPermission) should equal(false)
      hasRole(algoOnly, PermissionSet.HighTouchPermission) should equal(false)
      hasRole(algoOnly, PermissionSet.AlgoCoveragePermission) should equal(true)

      val highTouchOnly = addRole(PermissionSet.NoPermissions, PermissionSet.HighTouchPermission)

      hasRole(highTouchOnly, PermissionSet.SalesTradingPermission) should equal(false)
      hasRole(highTouchOnly, PermissionSet.HighTouchPermission) should equal(true)
      hasRole(highTouchOnly, PermissionSet.AlgoCoveragePermission) should equal(false)

      val highTouchSales = addRole(
        addRole(PermissionSet.NoPermissions, PermissionSet.HighTouchPermission), PermissionSet.AlgoCoveragePermission
      )

      hasRole(highTouchSales, PermissionSet.SalesTradingPermission) should equal(false)
      hasRole(highTouchSales, PermissionSet.HighTouchPermission) should equal(true)
      hasRole(highTouchSales, PermissionSet.AlgoCoveragePermission) should equal(true)
    }
  }

}
