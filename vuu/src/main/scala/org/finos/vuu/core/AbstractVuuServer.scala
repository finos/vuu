package org.finos.vuu.core

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.ModuleContainer
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.ClientSessionContainer
import org.finos.vuu.net.auth.Authenticator
import org.finos.vuu.viewport.ViewPortContainer

trait AbstractVuuServer {
  def sessionContainer: ClientSessionContainer
  def tableContainer: TableContainer
  def viewPortContainer: ViewPortContainer
  def moduleContainer: ModuleContainer

}
