package org.finos.vuu.feature.ignite

import org.scalatest.BeforeAndAfter
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteTestsBase extends AnyFeatureSpec with BeforeAndAfter with Matchers {

  protected var igniteTestStore: IgniteTestStore = _

  before {
    igniteTestStore = IgniteTestStore()
  }

  def givenOrderExistInIgnite(existingData: TestOrderEntity*): Unit = {
    existingData.foreach(order => igniteTestStore.save(order))
  }

  def assertEquavalent[T](filteredData: Array[T], expectedData: Array[T]): Unit = {
    filteredData shouldBe expectedData
  }

}
