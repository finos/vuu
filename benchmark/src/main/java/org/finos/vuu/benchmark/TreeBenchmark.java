package org.finos.vuu.benchmark;

import org.openjdk.jmh.annotations.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Benchmark)
public class TreeBenchmark {

  public static void main(String[] args) throws Exception {
    final TreeBenchmark bm = new TreeBenchmark();
    bm.tableSize = 10000;
    bm.setup();
    bm.treeLargeTable();
  }

  private org.finos.vuu.benchmark.tree.TreeBenchmark benchmark;

  @Param({ "10000", "100000", "500000", "1000000", "2000000", "5000000" })
  public int tableSize;

  @Setup
  public void setup(){
    benchmark = new org.finos.vuu.benchmark.tree.TreeBenchmark();
    System.out.println("Tree Benchmark - Setup: tableSize=" + tableSize);
    benchmark.setup(tableSize);
  }

    @Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 1)
    @Measurement(iterations = 1)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void treeLargeTable() throws IOException {
      System.out.println("TreeBenchmark java - treeLargeTable");
      benchmark.treeLargeTable();
    }
}


