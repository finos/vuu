package org.finos.toolbox.collection.queue

import org.scalatest.concurrent.Eventually.eventually
import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers

import java.util
import java.util.ArrayList
import java.util.concurrent.CompletableFuture

class PriorityBlockingQueueTest extends AnyFunSuite with Matchers {

  test("drainTo should preserve priority order (High Priority first)") {
    val bq = PriorityBlockingQueue[String](10)

    // 1. Fill regular queue
    bq.put("Normal 1")
    bq.put("Normal 2")

    // 2. Fill priority queue
    bq.putHighPriority("High 1")
    bq.putHighPriority("High 2")

    // 3. Drain everything
    val result = new util.ArrayList[String]()
    bq.drainTo(result)

    // Verify order: Priority items must appear before Normal items
    val expected = java.util.List.of("High 1", "High 2", "Normal 1", "Normal 2")
    result shouldBe expected
  }

  test("drainTo with maxElements should respect the limit and priority") {
    val bq = PriorityBlockingQueue[String](10)

    (1 to 5).foreach(f => bq.put(f.toString))             // 1, 2, 3, 4, 5 in regular
    (10 to 12).foreach(f => bq.putHighPriority(f.toString)) // 10, 11, 12 in priority

    val result = new util.ArrayList[String]()

    // Drain only 4 elements
    val count = bq.drainTo(result, 4)

    count shouldBe 4
    // Should take all 3 priority items and only 1 normal item
    result shouldBe java.util.List.of("10", "11", "12", "1")
  }

  test("put should block when regular queue capacity is reached") {
    val capacity = 2
    val bq = PriorityBlockingQueue[String](capacity)

    bq.put("1")
    bq.put("2")

    // Try to put a 3rd item in a separate thread
    val future = CompletableFuture.runAsync(() => bq.put("3"))

    // The future should not be finished because the queue is full
    Thread.sleep(200)
    future.isDone shouldBe false

    // Drain one item to free up space
    val sink = new util.ArrayList[String]()
    bq.drainTo(sink, 1) // Takes '1' from regular queue

    // Now the blocked 'put' should complete
    eventually {
      future.isDone shouldBe true
    }
  }

  test("putHighPriority should NOT block even if regular queue is full") {
    val bq = PriorityBlockingQueue[String](1)
    bq.put("1") // Regular queue now full

    // This should return immediately because LinkedBlockingQueue is unbounded
    bq.putHighPriority("99")

    val result = new util.ArrayList[String]()
    bq.drainTo(result)
    result shouldBe java.util.List.of("99", "1")
  }
}