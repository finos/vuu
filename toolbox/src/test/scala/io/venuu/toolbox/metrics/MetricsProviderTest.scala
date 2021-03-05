package io.venuu.toolbox.metrics

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

/**
  * Created by chris on 25/07/2016.
  */
class MetricsProviderTest extends AnyFeatureSpec with Matchers {

  Feature("Test metrics provider"){

    Scenario("test histogram"){

      val metrics: MetricsProvider = new MetricsProviderImpl()

      val histogram = metrics.histogram("foo.bar")

      histogram.update(1l)

      histogram.update(2l)

      histogram.update(3l)

      val snapshot = histogram.getSnapshot

      snapshot.getMax should equal(3l)
      snapshot.getMin should equal(1l)

    }

  }

}
