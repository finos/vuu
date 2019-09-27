package io.venuu.vuu.core.module

import java.util.concurrent.ConcurrentHashMap

import io.venuu.toolbox.lifecycle.DefaultLifecycleEnabled

/**
  * Created by chris on 17/08/2016.
  */
class ModuleContainer extends DefaultLifecycleEnabled{

  private val modules = new ConcurrentHashMap[String, RealizedViewServerModule]()

  def register(module: RealizedViewServerModule): Unit = modules.put(module.name, module)

  def get(name: String): Option[RealizedViewServerModule] = {
    Option(modules.get(name))
  }

}
