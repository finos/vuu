package org.finos.vuu.benchmark.sort;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;

import java.util.concurrent.TimeUnit;

@State(Scope.Thread)
public class SortBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private SortBenchmark benchmark;

    @Param({ "10000", "100000", "1000000" })
    public int tableSize;

    @Setup(Level.Trial)
    public void setup() {
        benchmark = new SortBenchmark(benchmarkHelper, tableSize);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void sortLargeTableSingle() {
        benchmark.sortLargeTableSingleColumn();
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void sortLargeTableMulti() {
        benchmark.sortLargeTableMultiColumn();
    }

}


