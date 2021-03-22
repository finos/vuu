package io.venuu.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.provider.JoinTableProvider
import io.vertx.core.impl.ConcurrentHashSet

/**
  * Created by chris on 22/12/2015.
  */
class AutoSubscribeTable(tableDef: TableDef, joinProvider: JoinTableProvider)(implicit override val metrics: MetricsProvider) extends SimpleDataTable(tableDef, joinProvider) with StrictLogging{

  private val onTrySubscribe =  metrics.counter(plusName("trySubscribe.count"))
  private val totalSubscribe =  metrics.counter(plusName("total.count"))

  private val subscriptionKeys = new ConcurrentHashSet[String]()

  def tryAndSubscribe(key: String): Unit = {

    totalSubscribe.inc()

    if(!subscriptionKeys.contains(key)){
      onTrySubscribe.inc()

      subscriptionKeys.add(key)
      getProvider.subscribe(key)
    }
    else
      logger.debug(s"not trying a second time to subscribe for ${key} from ")
  }

}
