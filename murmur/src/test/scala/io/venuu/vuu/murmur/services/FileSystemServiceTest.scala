/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 08/06/2020.
 *
 */
package io.venuu.vuu.murmur.services

import java.nio.file.{Path, Paths}

import io.venuu.vuu.murmur.services.fake.FakeFileSystemService
import monix.eval.Task
import monix.execution.Scheduler.Implicits.global
import monix.reactive.Consumer
import org.scalatest.concurrent.Eventually._
import org.scalatest.time._
import org.scalatest.{FeatureSpec, Matchers}

class FileSystemServiceTest  extends FeatureSpec with Matchers {

  feature("Test a reactive observer for fake file system"){

    scenario("set up a simple observer and poke in a new deploy version"){

      val service = new FakeFileSystemService

      val path1 = Paths.get("/Users/chris/Documents/Chris/Documents/Cv")
      val path2 = Paths.get("/Users/chris/Documents/Chris/Documents/Cv2")
      val path3 = Paths.get("/Users/chris/Documents/Chris/Documents/Cv3")

      val fileSystemService = new FakeFileSystemService

      fileSystemService.addListOnStartup(List(path1, path2, path3))
      //val task = fileSystemService.deployObservable.foreach( p => println("path" + p.toString))

      val pathsReturned = new java.util.concurrent.ConcurrentLinkedQueue[Path]()
      val pathsReturned2 = new java.util.concurrent.ConcurrentLinkedQueue[Path]()

      val consumer = {
          Consumer.foreach[Path](p => {
            println("got(1)" + p.toString)
            pathsReturned.add(p)
          } )
      }

      val consumer2 = {
        Consumer.foreach[Path](p => {
          println("got(2)" + p.toString)
          pathsReturned2.add(p)
        } )
      }

      implicit val opts = Task.defaultOptions

      val consumerTask: Task[Unit] = fileSystemService.deployObservable.consumeWith(consumer).executeAsync
      val fut = consumerTask.runToFuture

      val consumerTask2: Task[Unit] = fileSystemService.deployObservable.map(p => p).consumeWith(consumer2).executeAsync
      val fut2 = consumerTask2.runToFuture

      eventually {
        pathsReturned.size() shouldBe  3
      }

      fileSystemService.addNewDeploy(Paths.get("/Users/chris/Documents/Chris/Documents/Cv4"))

      eventually(timeout(Span(3, Seconds)), interval(Span(1, Milliseconds)))   {
        pathsReturned2.size() shouldBe 4
      }

     fut.cancel()
     fut2.cancel() 

    }
  }

}
