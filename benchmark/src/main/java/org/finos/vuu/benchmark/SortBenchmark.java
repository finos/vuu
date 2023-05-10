package org.finos.vuu.benchmark;

import org.openjdk.jmh.annotations.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Benchmark)
public class SortBenchmark {

  public static void main(String[] args) throws Exception {
    final SortBenchmark bm = new SortBenchmark();
    bm.tableSize = 10000;
    bm.setup();
    bm.sortLargeTable();
  }

  private org.finos.vuu.benchmark.sort.SortBenchmark benchmark;

  @Param({ "10000", "100000", "500000", "1000000", "2000000", "5000000" })
  public int tableSize;

  @Setup
  public void setup(){
    benchmark = new org.finos.vuu.benchmark.sort.SortBenchmark();
    System.out.println("Setup: tableSize=" + tableSize);
    benchmark.setup(tableSize);
  }

    @Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 1)
    @Measurement(iterations = 1)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void sortLargeTable() throws IOException {
      //System.out.println("Sort: tableSize=" + tableSize);
      benchmark.sortLargeTable();
    }
}


