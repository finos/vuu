package org.finos.vuu.example.valkey.client

import com.typesafe.scalalogging.StrictLogging
import io.valkey.UnifiedJedis
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.example.valkey.client.options.ValkeyClientOptions

class ValkeyClient(val options: ValkeyClientOptions)
                   (implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  private val valkeyClientInitializer = ValkeyClientInitializer(options)
  @volatile private var client: Option[UnifiedJedis] = Option.empty

  override def doStart(): Unit = synchronized {
    try {
      client = Option(valkeyClientInitializer.create())
    } catch {
      case e: Exception =>
        logger.error("Failed to start Valkey client", e)
        throw e
    }
  }

  override def doStop(): Unit = synchronized {
    client.foreach { c =>
      try {
        c.close()
      } catch {
        case e: Exception => logger.warn("Error closing Valkey client", e)
      }
      client = None
    }
  }

  override def doInitialize(): Unit = {
    //Nothing to do
  }

  override def doDestroy(): Unit = {
    //Nothing to do
  }

  override val lifecycleId: String = "ValkeyClient"
}

