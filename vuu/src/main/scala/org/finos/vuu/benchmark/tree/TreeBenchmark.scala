package org.finos.vuu.benchmark.tree

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.benchmark.BenchmarkHelper.{createBigTable, createTreeBuilder}
import org.finos.vuu.core.table._
import org.finos.vuu.provider.JoinTableProviderImpl
import org.finos.vuu.viewport.tree.{Tree, TreeBuilder}
import org.openjdk.jmh.annotations._
import org.openjdk.jmh.runner.Runner
import org.openjdk.jmh.runner.options.OptionsBuilder

import java.io.IOException
import java.util.concurrent.TimeUnit

@State(Scope.Benchmark)
class TreeBenchmark {

  var table: SimpleDataTable = null
  var treeBuilder: TreeBuilder = null
  implicit val clock: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl
  val joinProvider = JoinTableProviderImpl() // new EsperJoinTableProviderImpl()

  val tableContainer = new TableContainer(joinProvider)
  @Setup(Level.Invocation)
  def setup(size: Int): Unit = {
    table = createBigTable(size)
    treeBuilder = createTreeBuilder(table)
  }

  def doTree(table: SimpleDataTable, treeBuilder: TreeBuilder): Tree = {
    treeBuilder.buildEntireTree()
  }

  @Benchmark
  @OutputTimeUnit(TimeUnit.MILLISECONDS)
  @Warmup(iterations = 5)
  @Measurement(iterations = 10)
  @BenchmarkMode(Array(Mode.AverageTime))
  @throws[IOException]
  def treeLargeTable(): Unit = {
    doTree(table, treeBuilder)
  }

  def main(args: Array[String]): Unit = {
    val opts = new OptionsBuilder()
      .include(classOf[TreeBenchmark].getSimpleName)
      .warmupIterations(5)
      .measurementIterations(5)
      //.forks(1)
      .build
    new Runner(opts).run
  }

}

object TreeRun {
  def main(args: Array[String]): Unit = {
    val benchmark = new TreeBenchmark()
    benchmark.setup(1_000_000)
    benchmark.treeLargeTable()
  }
}