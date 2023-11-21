package org.finos.vuu.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock

class CompositeProvider(val providers: DefaultProvider*)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider {
  private val runner = new RunOnceLifeCycleRunner("CompositeProvider", runOnce)

  lifecycle(this).dependsOn(runner)

  def runOnce(): Unit = {}
  override def subscribe(key: String): Unit = {
    providers.foreach(_.subscribe(key))
  }

  override def doStart(): Unit = {
    providers.foreach(_.doStart)
  }

  override def doStop(): Unit = {
    providers.foreach(_.doStop)

  }

  override def doInitialize(): Unit = {
    providers.foreach(_.doInitialize)
  }

  override def doDestroy(): Unit = {
    providers.foreach(_.doDestroy)
  }

  override val lifecycleId: String = "org.finos.vuu.provider.CompositeProvider"
}
