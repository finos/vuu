package io.venuu.vuu.core.module.vui

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData}
import io.venuu.vuu.provider.Provider
import io.venuu.vuu.state.{VuiHeader, VuiStateStore}

class VuiStateStoreProvider(val table: DataTable, val store: VuiStateStore)(implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends Provider {

  private final val runner = new LifeCycleRunner("vuiStateStoreProviderRunner", () => runOnce(), minCycleTime = 10)
  override val lifecycleId: String = "vuiStateStoreProvider"
  @volatile
  private var lastState = List[VuiHeader]()

  def runOnce() = {

    val states = store.getAll()

    for(state <- states){

      table.processUpdate(state.uniqueId, RowWithData( state.uniqueId, Map("uniqueId" ->  state.uniqueId,
        "user" -> state.user,
        "id" -> state.id,
        "lastUpdate" -> state.lastUpdate )
      ),
        clock.now()
      )
    }

    for(oldState <- lastState){
      if(!states.contains(oldState)){
        table.processDelete(oldState.uniqueId)
      }
    }

    lastState = states
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}
}
