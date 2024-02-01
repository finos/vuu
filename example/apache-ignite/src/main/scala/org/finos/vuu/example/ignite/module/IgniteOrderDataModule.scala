package org.finos.vuu.example.ignite.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{Column, SimpleColumn}
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.example.ignite.provider.IgniteOrderDataProvider
import org.finos.vuu.example.ignite.schema.IgniteChildOrderEntity
import org.finos.vuu.feature.ignite.schema.SchemaMapper
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

class NoOpIgniteService extends RpcHandler

object IgniteOrderDataModule extends DefaultModule {
  private final val NAME = "IGNITE"

  def apply(igniteOrderStore: IgniteOrderStore)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addSessionTable(
        VirtualizedSessionTableDef(
          name = "bigOrders2",
          keyField = "orderId",
          columns = schemaMapper.tableColumns
        ),
        (_, _) => new IgniteOrderDataProvider(igniteOrderStore, schemaMapper),
        (table, _, _, _) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new NoOpIgniteService()
        )
      ).asModule()
  }

  private val tableColumnByExternalField: Map[String, Column] = Map(
    "id" -> ("orderId", classOf[Int]),
    "ric" -> ("ric", classOf[String]),
    "price" -> ("price", classOf[Double]),
    "quantity" -> ("quantity", classOf[Int]),
    "side" -> ("side", classOf[String]),
    "strategy" -> ("strategy", classOf[String]),
    "parentId" -> ("parentId", classOf[Int]),
  ).zipWithIndex
    .map({ case ((extField, (name, t)), i) => (extField, SimpleColumn(name, i, t)) })
    .toMap

  val schemaMapper: SchemaMapper = SchemaMapper(IgniteChildOrderEntity.getSchema, tableColumnByExternalField)
}
