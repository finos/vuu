package org.finos.vuu.example.rest.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.example.rest.RestClient
import org.finos.vuu.example.rest.model.Instrument
import org.finos.vuu.example.rest.provider.InstrumentsProvider.{columnNameByExternalField, externalSchema}
import org.finos.vuu.feature.ignite.schema.{ExternalEntitySchema, ExternalEntitySchemaBuilder, SchemaMapper}
import org.finos.vuu.provider.DefaultProvider

class InstrumentsProvider(table: DataTable, restClient: RestClient)
                         (implicit clock: Clock) extends DefaultProvider with StrictLogging {

  private val schemaMapper = SchemaMapper(externalSchema, table.getTableDef.columns, columnNameByExternalField)
  private val keyField = table.getTableDef.keyField

  override def doStart(): Unit = {
    logger.info("Populating REST Instruments table...")
    restClient.getInstruments
      .map(schemaMapper.toTableRowData)
      .foreach(rowData => {
        val key = rowData(keyField).toString
        table.processUpdate(key, RowWithData(key, rowData), clock.now())
      })
  }

  override val lifecycleId: String = "org.finos.vuu.example.rest.provider.InstrumentsProvider"
}

object InstrumentsProvider {
  val externalSchema: ExternalEntitySchema = ExternalEntitySchemaBuilder().withCaseClass[Instrument].build()
  val columnNameByExternalField: Map[String, String] = Map(
    "id"    -> "id",
    "ric"   -> "ric",
    "isin"  -> "isin",
    "ccy"   -> "currency"
  )
}
