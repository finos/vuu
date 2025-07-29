package org.finos.vuu.benchmark.tree;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Benchmark)
public class TreeBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private TreeBenchmark benchmark;

    @Param({ "10000", "100000", "500000", "1000000", "2000000", "5000000" })
    public int tableSize;

    @Setup
    public void setup() {
        benchmark = new TreeBenchmark(benchmarkHelper, tableSize);
        System.out.println("Tree Benchmark - Setup: tableSize=" + tableSize);
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


