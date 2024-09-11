package org.finos.vuu.core.module

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.TableDef

class TableDefContainer(var tablesByModule : Map[String, TableDefs] = Map()) extends StrictLogging {

  def this() = {
    this(Map())
  }

  def add(module: String, tableDefs: TableDefs): Unit = {
    logger.debug(s"Adding table defs for module $module " + this.hashCode() )
    tablesByModule = tablesByModule ++ Map(module -> tableDefs)
  }

  def get(module: String, table: String): TableDef = {
      tablesByModule.get(module) match {
        case Some(tableDefs) =>
          tableDefs.get(table)
        case None =>
          throw new Exception(s"Module $module not found in tableDef container")
      }
  }

  def getModuleCount: Int = tablesByModule.keys.size
}
