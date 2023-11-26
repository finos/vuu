package org.finos.vuu.feature.inmem

import org.finos.vuu.feature.PluginLocator
import org.finos.vuu.plugin.PluginType



trait VuuInMemPluginLocator extends PluginLocator {
  override def pluginType: PluginType = VuuInMemPluginType
}
