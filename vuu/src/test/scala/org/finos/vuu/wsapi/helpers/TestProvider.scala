package org.finos.vuu.wsapi.helpers

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

case class TestProviderFactory() {
  private var providers: Map[String, TestProvider] = Map.empty[String, TestProvider]

  def create(table: DataTable, dataSource: FakeDataSource): TestProvider = {
    val provider = new TestProvider(table, dataSource)
    providers = providers + (table.name -> provider)
    provider
  }

  def getProvider(tableName: String): TestProvider = {
    providers.get(tableName) match {
      case None => null
      case Some(provider) => provider
    }
  }
}

class TestProvider(table: DataTable, fakeDataSource: FakeDataSource) extends Provider with StrictLogging {

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {
    logger.debug(s"Test Provider for ${table.name}- Starting")
  }

  override def doStop(): Unit = {
    logger.debug(s"Test Provider for ${table.name}- Stopping")
  }

  override def doInitialize(): Unit = {
    logger.debug(s"Test Provider for ${table.name}- Initialising with ${fakeDataSource.size()} rows")
    fakeDataSource.get()
      .foreach(row => {
        table.processUpdate(row._1, RowWithData(row._1, row._2))
      })
  }

  def update(dataSource: FakeDataSource): Unit = {
    logger.debug(s"Test Provider for ${table.name}- Updating ${dataSource.size()} rows")
    dataSource.get()
      .foreach(row => {
        table.processUpdate(row._1, RowWithData(row._1, row._2))
      })
  }

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = s"TestProvider ${table.name}"
}
