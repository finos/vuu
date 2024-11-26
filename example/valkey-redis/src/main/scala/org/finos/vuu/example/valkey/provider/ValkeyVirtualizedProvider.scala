package org.finos.vuu.example.valkey.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.Clock
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.{ViewPort, ViewPortColumns}

class ValkeyVirtualizedProvider(implicit clock: Clock) extends VirtualizedProvider with StrictLogging  {

  override def runOnce(viewPort: ViewPort): Unit = ???
  override def getUniqueValuesVPColumn(columnName: String, viewPortColumns: ViewPortColumns): Array[String] = ???
  override def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPortColumns: ViewPortColumns): Array[String] = ???
  override def getUniqueValues(columnName: String): Array[String] = ???
  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] = ???
  override def subscribe(key: String): Unit = ???
  override def doStart(): Unit = ???
  override def doStop(): Unit = ???
  override def doInitialize(): Unit = ???
  override def doDestroy(): Unit = ???

  override val lifecycleId: String = ???
}
