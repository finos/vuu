package org.finos.vuu.plugin

import com.typesafe.scalalogging.StrictLogging

import java.util.concurrent.ConcurrentHashMap

object PluginRegistry{
  def apply(): PluginRegistry = new DefaultPluginRegistry()
}

class DefaultPluginRegistry extends PluginRegistry with StrictLogging{
  private val registry: ConcurrentHashMap[PluginType, Plugin] = new ConcurrentHashMap[PluginType, Plugin]()
  override def getPlugin(pluginType: PluginType): Plugin = registry.get(pluginType)
  override def registerPlugin(plugin: Plugin): Unit = registry.put(plugin.pluginType, plugin)
  override def withPlugin[RET](pluginType: PluginType)(block: Plugin => RET): RET = {
    val plugin = getPlugin(pluginType)
    block.apply(plugin)
  }
}

trait PluginRegistry {
  def getPlugin(pluginType: PluginType): Plugin
  def registerPlugin(plugin: Plugin): Unit

  def withPlugin[RET](pluginType: PluginType)(block: (Plugin) => RET): RET

}
