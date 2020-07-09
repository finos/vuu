/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 08/05/2020.
 *
 */
package io.venuu.vuu.murmur.reactive

import monix.eval.Task
import monix.execution.Ack.Continue
import monix.execution.{Ack, Callback, Cancelable, Scheduler}
import monix.reactive.{Consumer, Observable}
import org.scalatest.{FeatureSpec, Matchers}
import monix.execution.Scheduler.Implicits.global
import monix.execution.cancelables.AssignableCancelable
import monix.reactive.observers.Subscriber
import scala.concurrent.duration._

object Foo{
  implicit class ObservableSyntax[A](val o: Observable[A]) extends AnyVal{
    def transform[B](f: Observable[A] => Observable[B]): Observable[B] = f(o)
  }
}

class ReactiveStreamTest extends FeatureSpec with Matchers {

  case class Foo(i:Int)
  case class Bar(i: Int, x:Int)



  feature("test reactive streams with monix"){

    scenario("test stream implementation"){



      val consumer = new Consumer[Foo, Int] {
        override def createSubscriber(cb: Callback[Throwable, Int], s: Scheduler): (Subscriber[Foo], AssignableCancelable) = {
          val out = new Subscriber.Sync[Foo]{
            var sum = 0;
            override implicit def scheduler: Scheduler = s

            override def onNext(elem: Foo): Ack = {
              sum += elem.i
              Continue
            }

            override def onError(ex: Throwable): Unit = cb.onError(ex)

            override def onComplete(): Unit = cb.onSuccess(sum)
          }
          (out, AssignableCancelable.dummy)
        }
      }

      val iter: Iterator[Foo] = new Iterator[Foo]{
        var count = 10;
        override def hasNext: Boolean = count >= 0
        override def next(): Foo = {
          val c = Foo(count)
          count -= 1;
          if(count == 5) {
            println("sleeping")
            Thread.sleep(1000)
          }
          c
        }
      }

      val observable = Observable.fromIterator(Task(iter))

//      val task = observable.foreachL(println)
//      task.runToFuture

  //    val  consumer = Consumer.(println)
      
    val task = observable.consumeWith(consumer)

    task.runToFuture.foreach(i => println("here:" + i))
    }
  }



}
