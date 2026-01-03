package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.index.IndexedField

trait JoinTableIndices {

  def indexForColumn(column: Column): Option[IndexedField[_]]

}

object JoinTableIndices extends StrictLogging {

  def apply(joinTableDef: JoinTableDef, sourceTables: Map[String, DataTable]): JoinTableIndices = {

    val baseTableIndices = collectBaseTableIndices(joinTableDef, sourceTables)
    //TODO There should be a way to also use use indices from the non-base tables,
    // but we'd need to map the other table primary keys to a set of valid baseTable primary keys (using an index maybe?)

    logger.debug(s"Join table ${joinTableDef.name} has indices on columns: ${baseTableIndices.keys.map(_.name).mkString(", ")}")
    JoinTableIndicesImpl(baseTableIndices)
  }

  private def collectBaseTableIndices(joinTableDef: JoinTableDef, sourceTables: Map[String, DataTable]): Map[Column, IndexedField[_]] = {
    joinTableDef.joinColumns.collect {
      case jc: JoinColumn if jc.sourceTable == joinTableDef.baseTable => jc
    }.flatMap {
      jc => sourceTables(joinTableDef.baseTable.name).indexForColumn(jc.sourceColumn).map(jc -> _)
    }.toMap
  }

}

private case class JoinTableIndicesImpl(indices: Map[Column, IndexedField[_]]) extends JoinTableIndices {

  override def indexForColumn(column: Column): Option[IndexedField[_]] = {
    indices.get(column)
  }

}
