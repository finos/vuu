package org.finos.vuu.plugin

import io.vertx.core.impl.ConcurrentHashSet
import org.finos.vuu.feature.Feature

trait DefaultPlugin extends Plugin {

  private val features: ConcurrentHashSet[Feature] = new ConcurrentHashSet[Feature]()

  override def hasFeature(feature: Feature): Boolean = {
    features.contains(feature)
  }

  override def registerFeature(feature: Feature): Unit = {
    features.contains(feature) match {
      case true => throw new Exception(s"Feature $feature is already registered for this plugin")
      case false => features.add(feature)
    }
  }
}
