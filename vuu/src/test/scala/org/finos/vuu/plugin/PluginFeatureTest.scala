package org.finos.vuu.plugin

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.vuu.feature.{SessionTableFactory, SessionTableFeature, TableFeature}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class PluginFeatureTest extends AnyFeatureSpec with Matchers{

  Feature("Check plugin api"){

    Scenario("Check we can create a plugin"){

      implicit val metrics = new MetricsProviderImpl

      val plugin = TestPlugin()

      //plugin.hasFeature(SessionTableFeature) should be (true)

      //plugin.tableFactory.createTable()

    }
  }
}
