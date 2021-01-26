/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 16/06/2020.
 *
 */
package io.venuu.vuu.murmur.services.fake

import io.venuu.vuu.murmur.model.{Host, ModelConfig}
import io.venuu.vuu.murmur.services.definition.HttpService

class FakeHttpService extends HttpService{
  override def downloadDeploy(path: String, model: ModelConfig): Boolean = {
    val deployVersion = path.split("/").last
    println("Downloading deploy:" + deployVersion + " from " + model.hosts.head)
    Thread.sleep(100)
    println("Downloaded deploy:" + deployVersion + " from " + model.hosts.head)
    true
  }
}
