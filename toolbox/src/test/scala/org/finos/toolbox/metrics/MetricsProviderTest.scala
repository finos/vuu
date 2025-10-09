package org.finos.toolbox.metrics

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class MetricsProviderTest extends AnyFeatureSpec with Matchers {

  Feature("Test metrics provider"){

    Scenario("test histogram"){

      val metrics: MetricsProvider = new MetricsProviderImpl()

      val histogram = metrics.histogram("foo.bar")

      histogram.update(1L)

      histogram.update(2L)

      histogram.update(3L)

      val snapshot = histogram.getSnapshot

      snapshot.getMax should equal(3L)
      snapshot.getMin should equal(1L)

    }

  }

}
