package org.finos.vuu.example.rest.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.example.rest.client.InstrumentServiceClient
import org.finos.vuu.example.rest.model.Instrument
import org.finos.vuu.example.rest.provider.InstrumentsProvider.{INSTRUMENTS_COUNT, columnNameByExternalField, externalSchema}
import org.finos.vuu.provider.DefaultProvider
import org.finos.vuu.util.schema.{ExternalEntitySchema, ExternalEntitySchemaBuilder, SchemaMapper}

import scala.util.{Failure, Success}

class InstrumentsProvider(table: DataTable, client: InstrumentServiceClient)
                         (implicit clock: Clock) extends DefaultProvider with StrictLogging {


  private val schemaMapper = SchemaMapper(externalSchema, table.getTableDef.columns, columnNameByExternalField)
  private val keyField = table.getTableDef.keyField

  override def doStart(): Unit = {
    logger.info("Populating REST Instruments table...")
    client.getInstruments(limit = INSTRUMENTS_COUNT) match {
      case Failure(ex) => logger.error("An unexpected error occurred when querying instrument service:", ex)
      case Success(instruments) => instruments.iterator
        .map(schemaMapper.toTableRowData)
        .foreach(rowData => {
          val key = rowData(keyField).toString
          table.processUpdate(key, RowWithData(key, rowData), clock.now())
      })
    }
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
  val INSTRUMENTS_COUNT: Int = 10_000
}
