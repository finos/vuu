package io.venuu.vuu.core.module

import io.venuu.toolbox.lifecycle.DefaultLifecycleEnabled

import java.util.concurrent.ConcurrentHashMap

/**
  * Created by chris on 17/08/2016.
  */
class ModuleContainer extends DefaultLifecycleEnabled{

  import scala.jdk.CollectionConverters._

  private val modules = new ConcurrentHashMap[String, RealizedViewServerModule]()

  def register(module: RealizedViewServerModule): Unit = modules.put(module.name, module)

  def get(name: String): Option[RealizedViewServerModule] = {
    Option(modules.get(name))
  }

  def getAll() = CollectionHasAsScala(modules.values()).asScala.toList

}
