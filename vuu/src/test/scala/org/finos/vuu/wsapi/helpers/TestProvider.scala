package org.finos.vuu.wsapi.helpers

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

class TestProvider(table: DataTable, fakeDataSource: FakeDataSource)(implicit clock: Clock) extends Provider with StrictLogging {

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {
    logger.debug(s"Test Provider for ${table.name}- Starting")
  }

  override def doStop(): Unit = {
    logger.debug(s"Test Provider for ${table.name}- Stopping")
  }

  override def doInitialize(): Unit = {
    logger.debug(s"Test Provider for ${table.name}- Initialising")
    fakeDataSource.get()
      .foreach(row => {
        table.processUpdate(row._1, RowWithData(row._1, row._2), clock.now())
      })
  }

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = s"TestProvider ${table.name}"
}
