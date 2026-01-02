package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.index.IndexedField

trait JoinTableIndices {

  def indexForColumn(column: Column): Option[IndexedField[_]]

}

object JoinTableIndices extends StrictLogging {

  def apply(joinTableDef: JoinTableDef, sourceTables: Map[String, DataTable]): JoinTableIndices = {

    val baseTableJoinColumns = joinTableDef.joinColumns
      .map(c => c.asInstanceOf[JoinColumn])
      .filter(jc => jc != null && jc.sourceTable == joinTableDef.baseTable)
      .toList

    val baseSourceTable = sourceTables(joinTableDef.baseTable.name)

    val indices: Map[JoinColumn, IndexedField[_]] = baseTableJoinColumns
      .filter(jc => baseSourceTable.indexForColumn(jc.sourceColumn).isDefined)
      .map(jc => jc -> baseSourceTable.indexForColumn(jc.sourceColumn).get)
      .toMap()

    logger.debug(s"Adding indices for columns ${indices.keys.map(f => f.name)} in join table ${joinTableDef.name}")
    JoinTableIndicesImpl(indices)
  }

}

private case class JoinTableIndicesImpl(indices: Map[JoinColumn, IndexedField[_]]) extends JoinTableIndices {

  override def indexForColumn(column: Column): Option[IndexedField[_]] = {
    column match {
      case joinColumn: JoinColumn => indices.get(joinColumn)
      case _ => None
    }
  }

}
