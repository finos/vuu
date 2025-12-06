package org.finos.vuu.feature.ignite.api

import org.finos.vuu.api.{Indices, SessionTableDef, VisualLinks}
import org.finos.vuu.core.table.Column

case class IgniteSessionTableDef(override val name: String, override val keyField: String, override val customColumns: Array[Column])
  extends SessionTableDef(name, keyField, customColumns, Seq(), false, VisualLinks(), Indices())
  with VuuIgnitePluginLocator {
}
