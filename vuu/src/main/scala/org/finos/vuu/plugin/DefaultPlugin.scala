package org.finos.vuu.plugin

import org.finos.vuu.feature.Feature

import java.util.concurrent.ConcurrentHashMap

trait DefaultPlugin extends Plugin {

  private val features: java.util.Set[Feature] = ConcurrentHashMap.newKeySet()

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
