package org.finos.vuu.state

import org.finos.vuu.viewport.TestTimeStamp
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.junit.Assert.assertEquals
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers.shouldEqual

class VuiStateStoreTest extends AnyFeatureSpec {

  Feature("check we can add, get and remove ui states"){

    def addChris(store: VuiStateStore, data: String)(implicit clock: Clock) = {
      store.add(
        VuiState(
          VuiHeader("chris", "latest", "chris.latest", clock.now()),
          VuiJsonState(data)
        )
      )
    }

    def addSteve(store: VuiStateStore, data: String)(implicit clock: Clock) = {
      store.add(
        VuiState(
          VuiHeader("steve", "latest", "steve.latest", clock.now()),
          VuiJsonState(data)
        )
      )
    }

    Scenario("basic operations"){

      implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)

      val stateStore: VuiStateStore = new MemoryBackedVuiStateStore

      addChris(stateStore, "foo:{}")

      val key1 = stateStore.timeToVersion(clock.now())

      assertEquals("2011-07-24_220000.000", key1)

      clock.sleep(100)

      addChris(stateStore, "bar:{}")

      clock.sleep(100)

      addChris(stateStore, "bar2:{}")

      clock.sleep(100)

      addSteve(stateStore, "foobar:{}")

      val latest = stateStore.get("chris", "latest")

      latest.get.json.json shouldEqual("bar2:{}")

      val previous = stateStore.get("chris", key1)

      previous.get.json.json shouldEqual("foo:{}")

      stateStore.delete("chris", key1)

      val previousAfterDelete  = stateStore.get("chris", key1)

      previousAfterDelete shouldEqual(None)

      val allItems = stateStore.getAll()

      allItems.size shouldEqual(5)

      for( i <- 1 until 51){
        clock.sleep(100)
        addSteve(stateStore, s"foobar${i}:{}")
      }

      stateStore.getAllFor("steve").size shouldEqual(50)
    }
  }
}
