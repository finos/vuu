package org.finos.vuu.feature.ignite.api

import org.finos.vuu.feature.PluginLocator
import org.finos.vuu.feature.ignite.VuuIgnitePluginType
import org.finos.vuu.plugin.PluginType

trait VuuIgnitePluginLocator extends PluginLocator {
  override def pluginType: PluginType = VuuIgnitePluginType

}
