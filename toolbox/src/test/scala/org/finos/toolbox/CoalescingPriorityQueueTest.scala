package org.finos.toolbox

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class CoalescingPriorityQueueTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  Feature("check prioritized queue") {

    Scenario("check queue") {

      case class QueueEntry(int: Integer, text: String)

      val queue = new CoalescingPriorityQueueImpl[QueueEntry, Integer]( e => e.int, (x, y) => y)

      queue.push(new QueueEntry(0, "foo"));
      queue.push(new QueueEntry(1, "bar"));
      queue.pushHighPriority(new QueueEntry(2, "ping"));
      queue.pushHighPriority(new QueueEntry(3, "pong"));

      queue.pop().int should equal(2)
      queue.pop().int should equal(3)
      queue.pop().int should equal(0)
      queue.pop().int should equal(1)

      queue.push(new QueueEntry(4, "foo"));
      queue.push(new QueueEntry(5, "bar"));
      queue.pushHighPriority(new QueueEntry(6, "ping"));

      val dequeued = queue.popUpTo(10)

      dequeued.size should be(3)
      dequeued(0).int should equal(6)
    }
  }

}
