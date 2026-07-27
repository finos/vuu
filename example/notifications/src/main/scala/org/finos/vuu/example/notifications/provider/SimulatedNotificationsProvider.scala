package org.finos.vuu.example.notifications.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._
import scala.util.Random

class SimulatedNotificationsProvider(table: DataTable)(implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends Provider with StrictLogging {

  private val activeNotifications = new ConcurrentHashMap[String, Long]()
  private val random = new Random()

  private val sampleTemplates = Array(
    ("toast", "Order Execution", "Order #%04d filled %d shares of AAPL at $%d.%02d", "INFO", 12000L, "OMS", 2),
    ("toast", "Risk Limit Alert", "Account ACC-%04d exceeded intraday VaR limit by %d%%", "WARNING", 15000L, "RISK", 5),
    ("toast", "Feed Synchronization", "Connected to pricing feed NYC-%02d with latency %dms", "INFO", 10000L, "PRICING", 1),
    ("toast", "Connection Warning", "Intermittent packet loss detected on gateway LDN-%02d", "WARNING", 14000L, "GATEWAY", 3),
    ("toast", "Order Rejection", "Order #%04d rejected by exchange: Insufficient margin", "ERROR", 18000L, "OMS", 10),
    ("banner", "System Maintenance", "Scheduled system maintenance will begin in %d minutes", "WARNING", 45000L, "SYSTEM", 5),
    ("banner", "Market Status", "US Equity markets are now OPEN. Trading session #%d active", "INFO", 60000L, "SYSTEM", 1)
  )

  private val runner = new LifeCycleRunner("simulatedNotificationsProvider", () => runOnce(), minCycleTime = 4_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {
    logger.info("Starting SimulatedNotificationsProvider - populating initial notifications")
    (1 to 3).foreach(_ => generateRandomNotification())
  }

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "simulatedNotificationsProvider-" + table.name

  private def runOnce(): Unit = {
    try {
      val now = clock.now()

      // 1. Clean up expired notifications
      activeNotifications.entrySet().asScala.toList.foreach { entry =>
        if (entry.getValue < now) {
          table.processDelete(entry.getKey)
          activeNotifications.remove(entry.getKey)
          logger.debug(s"Expired and deleted notification ${entry.getKey}")
        }
      }

      // 2. Generate new notifications if we have fewer than 8 active notifications
      if (activeNotifications.size() < 8) {
        generateRandomNotification()
      }
    } catch {
      case e: Exception => logger.error("Error occurred in SimulatedNotificationsProvider runOnce", e)
    }
  }

  private def generateRandomNotification(): Unit = {
    val id = UUID.randomUUID().toString
    val now = clock.now()
    val template = sampleTemplates(random.nextInt(sampleTemplates.length))
    val notifType = template._1
    val title = template._2
    val messageFormat = template._3
    val level = template._4
    val duration = template._5
    val source = template._6
    val priority = template._7
    val expiryTime = now + duration

    val message = if (messageFormat.contains("%")) {
      try {
        messageFormat.format(random.nextInt(9000) + 1000, random.nextInt(90) * 10 + 100, random.nextInt(200) + 50, random.nextInt(99))
      } catch {
        case _: Exception => messageFormat
      }
    } else {
      messageFormat
    }

    val rowData: Map[String, Any] = Map(
      "id" -> id,
      "type" -> notifType,
      "expiryTime" -> expiryTime,
      "title" -> title,
      "message" -> message,
      "level" -> level,
      "source" -> source,
      "priority" -> priority
    )

    table.processUpdate(id, RowWithData(id, rowData))
    activeNotifications.put(id, expiryTime)
    logger.debug(s"Generated simulated notification $id ($title)")
  }
}
