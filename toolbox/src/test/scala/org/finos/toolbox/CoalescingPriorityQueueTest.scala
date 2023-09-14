package org.finos.toolbox

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class CoalescingPriorityQueueTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  Feature("check prioritized queue") {

    Scenario("check queue") {

      case class QueueEntry(int: Integer, text: String)

      val queue = new CoalescingPriorityQueueImpl[QueueEntry, Integer](e => e.int, (x, y) => y, (key1, key2) => {
        key1.compareTo(key2)
      })

      queue.push(QueueEntry(0, "foo"))
      queue.push(QueueEntry(1, "bar"))
      queue.pushHighPriority(QueueEntry(2, "ping"))
      queue.pushHighPriority(QueueEntry(3, "pong"))

      queue.pop().int should equal(2)
      queue.pop().int should equal(3)
      queue.pop().int should equal(0)
      queue.pop().int should equal(1)

      queue.push(QueueEntry(4, "foo"))
      queue.push(QueueEntry(5, "bar"))
      queue.pushHighPriority(QueueEntry(6, "ping"))

      val dequeued = queue.popUpTo(10)

      dequeued.size should be(3)
      dequeued(0).int should equal(6)
      dequeued(1).int should equal(4)
      dequeued(2).int should equal(5)

      queue.pushHighPriority(QueueEntry(7, "ping"))
      queue.pushHighPriority(QueueEntry(8, "ping"))
      queue.pushHighPriority(QueueEntry(9, "ping"))
      queue.pushHighPriority(QueueEntry(10, "ping"))

      val dequeued2 = queue.popUpTo(10)

      dequeued2.size should be(4)
      dequeued2(0).int should equal(7)
      dequeued2(1).int should equal(8)
      dequeued2(2).int should equal(9)
      dequeued2(3).int should equal(10)

      queue.push(QueueEntry(11, "foo"))
      queue.push(QueueEntry(12, "bar"))
      queue.push(QueueEntry(13, "bar"))

      val dequeued3 = queue.popUpTo(10)

      dequeued3.size should be(3)
      dequeued3(0).int should equal(11)
      dequeued3(1).int should equal(12)
      dequeued3(2).int should equal(13)
    }
  }

}
