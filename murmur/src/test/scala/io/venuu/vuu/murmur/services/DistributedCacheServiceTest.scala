/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 16/06/2020.
 *
 */
package io.venuu.vuu.murmur.services

import java.nio.file.Paths

import io.venuu.vuu.murmur.services.fake.{FakeDistributedCacheService, FakeFileSystemService, FakeHttpService}
import monix.reactive.Consumer
import org.scalatest.{FeatureSpec, Matchers}


class DistributedCacheServiceTest extends FeatureSpec with Matchers {

  feature("Create a distributed cache instance (ZK)") {

    ignore("Test the logic for the distributed cache instance") {

      val cacheService = new FakeDistributedCacheService
      val fileSystem = new FakeFileSystemService
      val httpService = new FakeHttpService

      val app = cacheService.get("murmur")

      val future = app.versionObservable()
        .filter(path => fileSystem.deployExists(Paths.get(path)))
        .find(path => httpService.downloadDeploy(path, app.getModel))
        .consumeWith(Consumer.foreach(path => println("Got version:" + path)))
        //.runToFuture



    }
  }
}
