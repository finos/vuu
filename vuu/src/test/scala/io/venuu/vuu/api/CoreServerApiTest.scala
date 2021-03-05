/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 15/12/14.
 *
 */
package io.venuu.vuu.api

import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.TestFriendlyClock
import io.venuu.vuu.core.CoreServerApiHander
import io.venuu.vuu.core.table.TableContainer
import io.venuu.vuu.provider.{JoinTableProviderImpl, ProviderContainer}
import io.venuu.vuu.viewport.ViewPortContainer
import org.scalatest.featurespec.AnyFeatureSpec

class CoreServerApiTest extends AnyFeatureSpec {

  Feature("Check core server api") {

    Scenario("Check when loading meta for viewport") {

      implicit val clock = new TestFriendlyClock(1311544800l)
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl

      val joinTableProvider = new JoinTableProviderImpl()
      val tableContainer = new TableContainer(joinTableProvider)
      val viewPortContainer = new ViewPortContainer(tableContainer)
      val providerContainer = new ProviderContainer(joinTableProvider)
      val coreServerApi = new CoreServerApiHander(viewPortContainer, tableContainer, providerContainer)

      //coreServerApi.process()

    }
  }

}
