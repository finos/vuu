/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 19/06/2020.
 *
 */
package io.venuu.vuu.murmur.services.real

import java.nio.file.Path

import io.venuu.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer, LifecycleEnabled}
import io.venuu.toolbox.net.http2.Http2Server
import io.venuu.vuu.murmur.model.ModelConfig
import io.venuu.vuu.murmur.services.definition.HttpService

class RealHttpService(httpPort: Int, httpsPort: Int, webRoot: Path)(implicit lifecycleContainer: LifecycleContainer) extends HttpService with LifecycleEnabled{

//  private final val server = new Http2Server(httpPort, httpsPort, webRoot.toAbsolutePath.toFile.toString)
//  lifecycleContainer(this).dependsOn(server)

  override def downloadDeploy(path: String, model: ModelConfig): Boolean = ???

  override def doStart(): Unit = ???
  override def doStop(): Unit = ???
  override def doInitialize(): Unit = ???
  override def doDestroy(): Unit = ???

  override val lifecycleId: String =  this.getClass.getCanonicalName
}
