import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# Providers

<SvgDottySeparator style={{marginBottom: 32}}/>

Providers are classes which receive data from a particlar location (network, file, in-process lib) and format that data into a map which matches the shape of the table
that the provider is populating. They have a very simple interface:

Included below is an example of the metrics provider.

```scala

class MetricsTableProvider (table: DataTable, tableContainer: TableContainer)(implicit clock: Clock, lifecycleContainer: LifecycleContainer,
                                                                              metrics: MetricsProvider ) extends Provider with StrictLogging {

  private val runner = new LifeCycleRunner("metricsTableProvider", () => runOnce, minCycleTime = 1_000)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "metricsTableProvider"

  def runOnce(): Unit ={

    try {

      val tables = tableContainer.getTables()

      tables.foreach(tableDef => {

        val counter = metrics.counter(tableDef.table + ".processUpdates.Counter");
        val size = tableContainer.getTable(tableDef.table).size()

        val meter = metrics.meter(tableDef.table + ".processUpdates.Meter")

        val upMap = Map("table" -> (tableDef.module + "-" + tableDef.table), "updateCount" -> counter.getCount, "size" -> size, "updatesPerSecond" -> meter.getOneMinuteRate);

        table.processUpdate(tableDef.table, RowWithData(tableDef.table, upMap), clock.now())

      })

    } catch {
      case e: Exception =>
        logger.error("Error occured in metrics", e)
    }
  }
}
```

As you can see from the code the important lines are:

```scala
  private val runner = new LifeCycleRunner("metricsTableProvider", () => runOnce, minCycleTime = 1_000)

  lifecycleContainer(this).dependsOn(runner)

```

This sets up a thread (in this case a lifecycle aware thread, so that it shuts down happily when the process is killed)

And the runOnce() method:

```scala
  def runOnce(): Unit ={

    try {

      val tables = tableContainer.getTables()

      tables.foreach(tableDef => {

        //source the metric's information from the metrics api for a specific table
        val counter = metrics.counter(tableDef.table + ".processUpdates.Counter");
        val size = tableContainer.getTable(tableDef.table).size()
        val meter = metrics.meter(tableDef.table + ".processUpdates.Meter")

        //format the data into a map
        val dataMap = Map("table" -> (tableDef.module + "-" + tableDef.table), "updateCount" -> counter.getCount, "size" -> size, "updatesPerSecond" -> meter.getOneMinuteRate);

        //pass the data into the table as a RowWithData object, the map embedded within
        table.processUpdate(tableDef.table, RowWithData(tableDef.table, dataMap), clock.now())

      })

    } catch {
      case e: Exception =>
        logger.error("Error occured in metrics", e)
    }
  }
```

As the code comments show the runOnce() method populates the table with data.
