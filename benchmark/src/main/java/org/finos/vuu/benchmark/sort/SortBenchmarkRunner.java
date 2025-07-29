package org.finos.vuu.benchmark.sort;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Benchmark)
public class SortBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private SortBenchmark benchmark;

    @Param({"10000"})
    public int tableSize;

    @Setup
    public void setup() {
        benchmark = new SortBenchmark(benchmarkHelper, tableSize);
        System.out.println("Sort Benchmark - Setup: tableSize=" + tableSize);
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


