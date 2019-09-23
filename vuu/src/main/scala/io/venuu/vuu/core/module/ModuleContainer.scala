package io.venuu.vuu.core.module

import java.util.concurrent.ConcurrentHashMap

import io.venuu.toolbox.lifecycle.DefaultLifecycleEnabled

/**
  * Created by chris on 17/08/2016.
  */
class ModuleContainer extends DefaultLifecycleEnabled{

  private val modules = new ConcurrentHashMap[String, ViewServerModule]()

  def register(module: ViewServerModule): Unit = modules.put(module.name, module)

  def get(name: String): Option[ViewServerModule] = {
    Option(modules.get(name))
  }

}
