package org.finos.vuu.example.valkey.client

import com.dimafeng.testcontainers.ForAllTestContainer
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.finos.vuu.example.valkey.ValkeyContainer

class ValkeyClientTest
  extends AnyFeatureSpec with GivenWhenThen with Matchers with ForAllTestContainer {

  override val container = ValkeyContainer()

  Feature("Test we can connect to a remote Valkey") {

    Scenario("Connect to a single instance") {

    }

  }

}
