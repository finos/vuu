package org.finos.vuu.wsapi.helpers

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.{ColumnBuilder, TableDef, TableDefOptions}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.table.{Column, DataTable, RowWithData}
import org.finos.vuu.provider.Provider

import scala.collection.immutable.ListMap

case class TestProviderFactory() {

  val providerFactory: (DataTable, AbstractVuuServer) => TestProvider =
    (table: DataTable, _: AbstractVuuServer) => create(table, TestTable.dataSource)

  val largeProviderFactory: (DataTable, AbstractVuuServer) => TestProvider =
    (table: DataTable, _: AbstractVuuServer) => create(table, TestTable.largeDataSource)

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

  def delete(dataSource: FakeDataSource): Unit = {
    logger.debug(s"Test Provider for ${table.name}- Deleting ${dataSource.size()} rows")
    dataSource.get()
      .foreach(row => {
        table.processDelete(row._1)
      })
  }

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = s"TestProvider ${table.name}"
}
