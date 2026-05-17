package org.finos.vuu.benchmark.tree;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Thread)
public class TreeBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private TreeBenchmark benchmark;

    @Param({ "10000", "100000", "500000", "1000000" })
    public int tableSize;

    @Setup(Level.Trial)
    public void setup() {
        benchmark = new TreeBenchmark(benchmarkHelper, tableSize);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void treeLargeTable() throws IOException {
        benchmark.treeLargeTable();
    }

}


