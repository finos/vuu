package org.finos.vuu.core.module.vui

import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider
import org.finos.vuu.state.{VuiHeader, VuiStateStore}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock

class VuiStateStoreProvider(val table: DataTable, val store: VuiStateStore)(implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends Provider {

  private final val runner = new LifeCycleRunner("vuiStateStoreProviderRunner", () => runOnce(), minCycleTime = 10)
  override val lifecycleId: String = "vuiStateStoreProvider"
  @volatile
  private var lastState = List[VuiHeader]()

  lifecycleContainer(this).dependsOn(runner)

  def runOnce() = {

    val states = store.getAll()

    for (state <- states) {

      table.processUpdate(state.uniqueId, RowWithData(state.uniqueId, Map("uniqueId" -> state.uniqueId,
        "user" -> state.user,
        "id" -> state.id,
        "lastUpdate" -> state.lastUpdate)
      ))
    }

    for (oldState <- lastState) {
      if (!states.contains(oldState)) {
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
