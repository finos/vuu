package org.finos.vuu.core.table
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.api.TableDef
import org.finos.vuu.provider.JoinTableProvider

class BasketTable(tableDef: TableDef, joinProvider: JoinTableProvider)(implicit override val metrics: MetricsProvider) extends SimpleDataTable(tableDef, joinProvider) with StrictLogging {
  var basketConstituentTable: BasketConstituentTable = null
  def setConstituentTable(basketConstituentTable: BasketConstituentTable): Unit = {
    this.basketConstituentTable = basketConstituentTable
  }
}


