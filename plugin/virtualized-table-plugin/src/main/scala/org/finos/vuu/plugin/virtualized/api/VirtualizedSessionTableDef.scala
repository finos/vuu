package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.api.{Indices, SessionTableDef, VisualLinks}
import org.finos.vuu.core.table.Column

case class VirtualizedSessionTableDef (override val name: String, override val keyField: String,
                                       override val columns: Array[Column]) extends SessionTableDef(name, keyField, columns, Seq(), false, VisualLinks(), Indices()){

}
