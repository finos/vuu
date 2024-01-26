package org.finos.vuu.feature.ignite

import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteTestsBase extends AnyFeatureSpec with BeforeAndAfterEach with Matchers {

  protected val igniteTestStore: IgniteTestStore = IgniteTestStore()

  override def beforeEach(): Unit = {
    super.beforeEach()
    igniteTestStore.clear()
  }

  def givenOrderExistInIgnite(existingData: TestOrderEntity*): Unit = {
    existingData.foreach(order => igniteTestStore.save(order))
  }

  def assertEquavalent[T](filteredData: Array[T], expectedData: Array[T]): Unit = {
    filteredData shouldBe expectedData
  }

}
