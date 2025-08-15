package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule.BasketTradingColumnNames.{TotalNotional, TotalNotionalUsd}
import org.finos.vuu.core.module.basket.BasketModule.BasketTradingConstituentColumnNames.{InstanceId, Quantity}
import org.finos.vuu.core.module.basket.BasketModule.BasketTradingConstituentJoin
import org.finos.vuu.core.table.{DataTable, RowWithData, TableContainer}
import org.finos.vuu.provider.DefaultProvider

class BasketTradingProvider(val table: DataTable, val tableContainer: TableContainer)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider{
  private val runner = new LifeCycleRunner("BasketTradingProvider", runOnce, minCycleTime = 2_000)

  lifecycle(this).dependsOn(runner)

  def runOnce(): Unit = {

    val constituent = tableContainer.getTable(BasketTradingConstituentJoin)

    table.primaryKeys.foreach( key => {

      val sumOfNotional = constituent.primaryKeys.filter( conKey =>{
          val row = constituent.pullRow(conKey)
           row.get(InstanceId).asInstanceOf[String] == key
      }).map(conKey => {

        val quantity = constituent.pullRow(conKey).get(Quantity).asInstanceOf[Long]
        val bid =constituent.pullRow(conKey).get("bid").asInstanceOf[Double]
        val ask =constituent.pullRow(conKey).get("ask").asInstanceOf[Double]
        val last =constituent.pullRow(conKey).get("last").asInstanceOf[Double]

        if(last > 0){
          quantity * last
        }else if(bid > 0){
          quantity * bid
        } else if (ask > 0) {
          quantity * ask
        }else{
          0
        }

      } ).sum

      table.processUpdate(key, RowWithData(key, Map(InstanceId -> key, TotalNotionalUsd -> sumOfNotional.asInstanceOf[Long], TotalNotional -> sumOfNotional.asInstanceOf[Long])))
    })

  }

    override val lifecycleId: String = "BasketTradingProvider#" + hashCode()
}
