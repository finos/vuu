package org.finos.toolbox.metrics

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class MetricsProviderTest extends AnyFeatureSpec with Matchers {

  Feature("Test metrics provider"){

    Scenario("test histogram"){

      val metrics: MetricsProvider = new MetricsProviderImpl()

      val histogram = metrics.histogram("foo.bar")

      histogram.record(1.0)

      histogram.record(2.0)

      histogram.record(3.0)

      val snapshot = histogram.takeSnapshot()

      snapshot.max() should equal(3.0)
      snapshot.count() should equal(3L)
      snapshot.mean() should equal(2.0)

    }

  }

}
