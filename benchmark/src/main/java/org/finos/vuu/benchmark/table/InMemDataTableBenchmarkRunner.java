package org.finos.vuu.benchmark.table;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Thread)
public class InMemDataTableBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private InMemDataTableBenchmark benchmark;

    @Param({ "50000", "250000", "500000" })
    public int insertSize;

    @Setup(Level.Iteration)
    public void setup() {
        benchmark = new InMemDataTableBenchmark(benchmarkHelper);
        benchmark.addRows(insertSize);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void iterateRows(Blackhole bh) throws IOException {
        benchmark.iterateRows(bh);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void updateRows() throws IOException {
        benchmark.updateRows(insertSize);
    }

}
