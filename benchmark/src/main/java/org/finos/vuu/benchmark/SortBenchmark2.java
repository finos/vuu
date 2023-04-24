package org.finos.vuu.benchmark;

import org.openjdk.jmh.annotations.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Benchmark)
public class SortBenchmark2 {

  private SortBenchmark benchmark;

  @Setup
  public void setup(){
    benchmark = new SortBenchmark();
    benchmark.setup();
  }

    @Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 3)
    @Measurement(iterations = 2)
    @BenchmarkMode(Mode.AverageTime)
    public void sortLargeTable() throws IOException {
      benchmark.sortLargeTable();
    }
}
