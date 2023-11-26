package org.finos.vuu.plugin

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.feature.{Feature, FilterFactory, JoinTableFactory, SessionTableFactory, SortFactory, TableFactory, ViewPortFactory, ViewPortKeysCreator}

trait Plugin {
    def hasFeature(feature: Feature): Boolean
    def registerFeature(feature: Feature): Unit
    def tableFactory(implicit metrics: MetricsProvider): TableFactory
    def pluginType: PluginType
    def joinTableFactory(implicit metrics: MetricsProvider): JoinTableFactory
    def sessionTableFactory: SessionTableFactory
    def viewPortKeysCreator: ViewPortKeysCreator
    def viewPortFactory: ViewPortFactory
    def filterFactory: FilterFactory
    def sortFactory: SortFactory
}
