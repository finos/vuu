package org.finos.vuu.benchmark

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.sort.{GenericSort, GenericSort2}
import org.finos.vuu.core.table.{SimpleDataTable, ViewPortColumnCreator}
import org.finos.vuu.net.{SortDef, SortSpec}
import org.openjdk.jmh.annotations._
import org.openjdk.jmh.runner.Runner
import org.openjdk.jmh.runner.options.OptionsBuilder

import java.io.IOException
import java.util.concurrent.TimeUnit

@State(Scope.Benchmark)
class SortBenchmark {

  import SortBenchmarkHelper._

  var table: SimpleDataTable = null

  @Setup(Level.Invocation)
  def setup(): Unit = {
    table = createBigTable(2_000_000)
  }

  def doSort(table: SimpleDataTable, sort: GenericSort2): ImmutableArray[String] = {
    val viewPortColumns = ViewPortColumnCreator.create(table, table.columns().filter(_.name.equals("exchange")).map(_.name).toList)
    sort.doSort(table, table.primaryKeys, viewPortColumns)
  }

  @Benchmark
  @OutputTimeUnit(TimeUnit.MILLISECONDS)
  @Warmup(iterations = 5)
  @Measurement(iterations = 10)
  @BenchmarkMode(Array(Mode.AverageTime))
  @throws[IOException]
  def sortLargeTable(): Unit = {
    implicit val clock: Clock = new DefaultClock
    val sort = GenericSort2(SortSpec(List(SortDef("exchange", 'A'))), table.getTableDef.columns.filter(_.name == "exchange").toList)
    doSort(table, sort)
  }

  def main(args: Array[String]): Unit = {
    val opts = new OptionsBuilder()
      .include(classOf[SortBenchmark].getSimpleName)
      .warmupIterations(5)
      .measurementIterations(5)
      //.forks(1)
      .build
    new Runner(opts).run
  }

}

object SortRun {
  def main(args: Array[String]): Unit = {
    val benchmark = new SortBenchmark()
    benchmark.setup()
    benchmark.sortLargeTable()
  }
}