package org.finos.toolbox.collection.queue

import org.scalatest.concurrent.Eventually.eventually
import org.scalatest.funsuite.AnyFunSuite
import org.scalatest.matchers.should.Matchers

import java.util
import java.util.ArrayList
import java.util.concurrent.CompletableFuture

class BinaryPriorityBlockingQueueTest extends AnyFunSuite with Matchers {

  test("take should block - cleared by regular queue") {
    val bq = BinaryPriorityBlockingQueue[String](10)

    val future = CompletableFuture.supplyAsync(() => bq.take())
    bq.put("Normal 1")

    eventually {
      future.isDone shouldBe true
      future.get() shouldEqual Some("Normal 1")
    }
  }

  test("take should block - cleared by priority queue") {
    val bq = BinaryPriorityBlockingQueue[String](10)

    val future = CompletableFuture.supplyAsync(() => bq.take())
    bq.putHighPriority("High 1")

    eventually {
      future.isDone shouldBe true
      future.get() shouldEqual Some("High 1")
    }
  }

  test("take should block - cleared by shutdown") {
    val bq = BinaryPriorityBlockingQueue[String](10)

    val future = CompletableFuture.supplyAsync(() => bq.take())
    bq.shutdown()

    eventually {
      future.isDone shouldBe true
      future.get() shouldEqual None
    }
  }

  test("drainTo should preserve priority order (High Priority first)") {
    val bq = BinaryPriorityBlockingQueue[String](10)
    bq.put("Normal 1")
    bq.put("Normal 2")
    bq.putHighPriority("High 1")
    bq.putHighPriority("High 2")

    val result = new util.ArrayList[String]()
    bq.drainTo(result)

    val expected = java.util.List.of("High 1", "High 2", "Normal 1", "Normal 2")
    result shouldBe expected
  }

  test("drainTo with maxElements should respect the limit and priority") {
    val bq = BinaryPriorityBlockingQueue[String](10)
    (1 to 5).foreach(f => bq.put(f.toString))
    (10 to 12).foreach(f => bq.putHighPriority(f.toString))

    val result = new util.ArrayList[String]()
    val count = bq.drainTo(result, 4)

    count shouldBe 4
    result shouldBe java.util.List.of("10", "11", "12", "1")
  }

  test("put should block when regular queue capacity is reached - cleared by drain") {
    val capacity = 2
    val bq = BinaryPriorityBlockingQueue[String](capacity)
    bq.put("1")
    bq.put("2")

    val future = CompletableFuture.runAsync(() => bq.put("3"))
    Thread.sleep(200)
    future.isDone shouldBe false
    bq.drainTo(new util.ArrayList[String]())

    eventually {
      future.isDone shouldBe true
    }
  }

  test("put should block when regular queue capacity is reached - cleared by take") {
    val capacity = 2
    val bq = BinaryPriorityBlockingQueue[String](capacity)
    bq.put("1")
    bq.put("2")

    val future = CompletableFuture.runAsync(() => bq.put("3"))
    Thread.sleep(200)
    future.isDone shouldBe false
    bq.take()

    eventually {
      future.isDone shouldBe true
    }
  }

  test("putHighPriority should NOT block even if regular queue is full") {
    val bq = BinaryPriorityBlockingQueue[String](1)
    bq.put("1")

    bq.putHighPriority("99")

    val result = new util.ArrayList[String]()
    bq.drainTo(result)
    result shouldBe java.util.List.of("99", "1")
  }

}